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
function BitReader(data, data_off, len) {
  this.data8_=data,
  this.data8_off=data_off,
  this.len8_=len,
  this.val_=((data[data_off+0] << 0) | (data[data_off+1] << 8) | (data[data_off+2] << 16) | (data[data_off+3] << 24))>>>0,
  this.pos8_=4,
  this.bit_pos_=0;
  //PIK_ASSERT(len % 32 == 0);

  this.FillBitBuffer=function() {
    if ((this.bit_pos_ >= 8)) {
      this.val_ >>>= 8;
      if (this.pos8_ < this.len8_) {
        this.val_ += ((this.data8_[this.data8_off+this.pos8_+0]) << 24)>>>0;
      }
      this.pos8_+=1;
      this.bit_pos_ -= 8;
    }
  }

  this.Advance=function(num_bits) {if(num_bits+this.bit_pos_>=32) console.log(this.bit_pos_);
    this.bit_pos_ += num_bits;
  }

  this.PeekFixedBits=function(N) {
	  this.FillBitBuffer();if(N+this.bit_pos_>=32) console.log(this.bit_pos_);
    static_assert(N <= 30, "At most 30 bits may be read.");
    return (this.val_ >>> this.bit_pos_) & ((1 << N) - 1);
  }

  this.PeekBits=function(nbits) {this.FillBitBuffer();if(nbits+this.bit_pos_>=32) console.log(this.bit_pos_);
    return (this.val_ >>> this.bit_pos_) & ((1 << nbits) - 1);
  }
  // Returns the byte position, aligned to 4 bytes, where the next chunk of
  // data should be read from after all symbols have been decoded.
  this.Position=function() {
    var bits_read = 8 * this.pos8_ + this.bit_pos_ - 32;
    var bytes_read = (bits_read + 7) / 8;
    return (bytes_read + 3) & ~3;
  }

  this.ReadBits=function(nbits) {
    this.FillBitBuffer();
    var bits = this.PeekBits(nbits);
    this.bit_pos_ += nbits;
    return bits;
  }

}
