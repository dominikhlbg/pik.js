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
var kYToBRes = 48;
CompressedImage.prototype = function() {
  this.xsize_;
  this.ysize_;
  this.block_xsize_;
  this.block_ysize_;
  this.quant_xsize_;
  this.quant_ysize_;
  this.num_blocks_;
  this.quantizer_=new Quantizer();
  this.dct_coeffs_=new Image3W();
  // The opsin dynamics image as seen by the decoder, kept for prediction
  // context.
  this.opsin_recon_=new Image3F();
  this.srgb_=new Image3B();
  // Transformed version of the original image, only present if the image
  // was constructed with FromOpsinImage().
  this.opsin_image_=new Image3F();
  this.ytob_dc_;
  this.ytob_ac_=new Image_();
  // Not owned, used to report additional statistics to the callers of
  // PixelsToPik() and PikToPixels().
  this.pik_info_=new PikInfo();
}

  CompressedImage.prototype.MoveSRGB=function() {
    this.srgb_.ShrinkTo(this.xsize_, this.ysize_);
    return this.srgb_;//std::move()
  }


  CompressedImage.prototype.YToBDC=function() { return this.ytob_dc_ / 128.0; }
  CompressedImage.prototype.YToBAC=function(tx, ty) { return this.ytob_ac_.Row(ty)[this.ytob_ac_.Row_off(ty)+ tx] / 128.0; }

