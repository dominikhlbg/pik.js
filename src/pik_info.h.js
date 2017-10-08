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
function PikImageSizeInfo() {
  this.num_clustered_histograms = 0;
  this.histogram_size = 0;
  this.entropy_coded_bits = 0;
  this.extra_bits = 0;
  this.total_size = 0;
}

function PikInfo() {
  this.ytob_image_size = 0;
  this.quant_image_size = 0;
  this.dc_image=new PikImageSizeInfo();
  this.ac_image=new PikImageSizeInfo();
  this.num_butteraugli_iters = 0;
  this.num_gabor_iters = 0;
  // If not empty, additional debugging information (e.g. debug images) is
  // saved in files with this prefix.
  this.debug_prefix='';
}