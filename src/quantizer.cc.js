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
var kGlobalScaleDenom = 1 << 16;
var kQuantMax = 256;
var kDefaultQuant = 64;

function Quantizer() {
this._=function(quant_xsize, quant_ysize, coeffs_per_block,
                   dequant_matrix) {
    this.quant_xsize_=(quant_xsize),
    this.quant_ysize_=(quant_ysize),
    this.coeffs_per_block_=(coeffs_per_block),
    this.dequant_matrix_=(dequant_matrix),
    this.global_scale_=(kGlobalScaleDenom / kDefaultQuant),
    this.quant_dc_=(kDefaultQuant),
    this.quant_img_ac_=new Image_(),this.quant_img_ac_._3(this.quant_xsize_, this.quant_ysize_, kDefaultQuant),
    this.scale_=new Image3F(),this.scale_._2(this.quant_xsize_ * this.coeffs_per_block_, this.quant_ysize_),
    this.initialized_=(false);
}
this.Decode=function(data, data_off, len) {
  var pos = 0;
  this.global_scale_ = data[data_off+(pos++)] << 8;
  this.global_scale_ += data[data_off+(pos++)];
  this.quant_dc_ = data[data_off+(pos++)] + 1;
  pos += DecodePlane(data,data_off + pos, len - pos, 1, kQuantMax, this.quant_img_ac_);
  this.inv_global_scale_ = kGlobalScaleDenom * 1.0 / this.global_scale_;
  this.inv_quant_dc_ = this.inv_global_scale_ / this.quant_dc_;
  this.initialized_ = true;
  return pos;
}

}