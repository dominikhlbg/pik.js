// Copyright 2017 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Common parameters that are needed for both the ANS entropy encoding and
// decoding methods.
// Copyright Dominik Homberger
function U32Coder() {
	this.MaxCompressedBits=function() {
    	return 2 + 4 * 8;//sizeof(uint32_t)
	}
  // The four bytes of "selector_bits" (sorted in ascending order from
  // low to high bit indices) indicate how many bits for each selector, or
  // zero if the selector represents the value directly.
  this.Load=function(selector_bits,
            source) {
    if (source.CanRead32()) {
      source.Read32();
    }
    var selector = source.Extract(2);
    var num_bits = NumBits(selector_bits, selector);
    if (num_bits == 0) {
      return selector;
    }
    if (source.CanRead32()) {
      source.Read32();
    }
    return source.ExtractVariableCount(num_bits);
  }

  function NumBits(selector_bits, selector) {
    return (selector_bits >>> (selector * 8)) & 0xFF;
  }
}

function FieldReader(source) {
	this.source_=source;
  this.operator=function(selector_bits,
                  value) {
    value[0] = (new U32Coder()).Load(selector_bits, this.source_);
  }

}

function FieldMaxSize() {
  this.operator=function(selector_bits,
                  value) {
    this.max_bits_ += (new U32Coder()).MaxCompressedBits();
  }
  
  this.MaxBytes = function() { return Math.floor((this.max_bits_ + 7) / 8); }

  this.max_bits_ = 0;
}

function Magic() {
  this.CompressedSize=function() {
    return 4;
  }
  this.Verify=function(source) {
    if (source.CanRead32()) {
      source.Read32();
    }
    for (var i = 0; i < 4; ++i) {
      if (source.Extract(8) != String_(i)) {
        return false;
      }
    }
    return true;
  }

  function String_(pos) {
    // \n causes files opened in text mode to be rejected, and \xCC detects
    // 7-bit transfers (it is also an uppercase I with accent in ISO-8859-1).
    return "P\xCCK\n".charCodeAt(pos);
  }
}

function MaxCompressedHeaderSize() {
  var size = (new Magic()).CompressedSize();

  // Fields
  var max_size=new FieldMaxSize();
  var header=new Header();
  header.VisitFields(max_size);
  size += max_size.MaxBytes();
  return size + 8;  // plus BitSink safety margin.
}

function LoadHeader(source,
                header) {
  if (!(new Magic()).Verify(source)) {
    return PIK_FAILURE("Wrong magic bytes.");
  }

  var reader=new FieldReader(source);
  header.VisitFields(reader);
  return true;
}

