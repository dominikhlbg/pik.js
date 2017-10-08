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
var kU32Selectors = 0x20181008;

function Header() {
  //enum Flags {
    // The last plane is alpha and compressed without loss. None of the
    // other components are premultiplied.
    this.kAlpha = 1;


    // Any non-alpha plane(s) are compressed without loss.
    this.kWebPLossless = 4;

    // A palette precedes the image data (indices, possibly more than 8 bits).
    this.kPalette = 8;

  //};
  this.VisitFields=function(visitor) {
    // Almost all camera images are less than 8K * 8K. We also allow the
    // full 32-bit range for completeness.
    visitor.operator(0x200E0B09, this.xsize);
    visitor.operator(0x200E0B09, this.ysize);
    // 2-bit encodings for 1 and 3 common cases; a dozen components for
    // remote-sensing data, or thousands for hyperspectral images.
    visitor.operator(0x00100004, this.num_components);
    visitor.operator(kU32Selectors, this.flags);

    // Do not add other fields - only sections can be added.
  }
  this.xsize = [0];
  this.ysize = [0];
  this.num_components = [0];
  this.flags = [0];
}