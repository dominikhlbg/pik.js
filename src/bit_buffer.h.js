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
function BitSource(from,from_off) {
    var bits=0;//[];
    //memcpy(bits,0, from,0, 8);
	bits=GetEL32(from,0);
    this.buffer_ = bits;// _mm_cvtsi64_si128(PIK_BSWAP64(bits));
    // There are 32 upper bits to extract before reaching the lower bits.
    this.lower_bits_extracted_ = -32;

  this.Extract=function(num_bits) {
    var bits = (this.buffer_ >>> (32 - num_bits))&255;
    var code = bits;//_mm_cvtsi128_si64
    this.buffer_ <<= num_bits;
    this.lower_bits_extracted_ += num_bits;
    return code;
  }

  // (Slightly less efficient code: num_bits is loaded into a vector.)
  this.ExtractVariableCount=function(num_bits) {
    var bits = (this.buffer_ >>> (32 - num_bits));
    var code = bits;//_mm_cvtsi128_si64
    this.buffer_ <<= num_bits;
    this.lower_bits_extracted_ += num_bits;
    return code;
  }

  // Returns whether the buffer has space for reading 32 more bits.
  this.CanRead32=function() { return (this.lower_bits_extracted_ >= 0); }

  // Reads the next 32 bits into the buffer. Precondition: CanRead32 =>
  // lower_bits_extracted_ >= 0 => buffer_[0,32) == 0.
  this.Read32=function() {
    var shift = this.lower_bits_extracted_;//_mm_cvtsi64_si128()
    var bits=0;//[];
    //memcpy(bits,0, this.read_pos_,0, 4);
	bits=GetEL32(this.read_pos_,this.read_pos_off);
    this.read_pos_off += 4;
    var vbits=bits;//(_mm_cvtsi64_si128(PIK_BSWAP32()));
    // The upper half may have had some zeros at the bottom, so match that.
    this.buffer_ += vbits << shift;
    this.lower_bits_extracted_ -= 32;
  }

  // Returns the byte-aligned end position after all extracted bits.
  this.Finalize=function() {
  this.read_pos_off+=4;
    var excess_bytes = ((32 - this.lower_bits_extracted_) / 8)|0;
    return this.read_pos_off - excess_bytes;
  }

  var V = 0;// PIK_TARGET_NAME::V2x64U;
  //this.buffer_=V;
  //this.lower_bits_extracted_=0;
  this.read_pos_=from;
  this.read_pos_off=4;
}