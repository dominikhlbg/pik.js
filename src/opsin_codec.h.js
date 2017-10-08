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
var kNaturalCoeffOrder = new Array(
  0,   1,  8, 16,  9,  2,  3, 10,
  17, 24, 32, 25, 18, 11,  4,  5,
  12, 19, 26, 33, 40, 48, 41, 34,
  27, 20, 13,  6,  7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36,
  29, 22, 15, 23, 30, 37, 44, 51,
  58, 59, 52, 45, 38, 31, 39, 46,
  53, 60, 61, 54, 47, 55, 62, 63,
  // extra entries for safety in decoder
  63, 63, 63, 63, 63, 63, 63, 63,
  63, 63, 63, 63, 63, 63, 63, 63
);

function CoeffProcessor(stride) {
  this.stride_=(stride);
  this.num_contexts=function() { return 3; }
}

// Reorder the symbols by decreasing population-count (keeping the first
// end-of-block symbol in place).
var kIndexLut = new Array(
  0,   1,   2,   3,   5,  10,  17,  32,
  68,  83,  84,  85,  86,  87,  88,  89,
  90,   4,   7,  12,  22,  31,  43,  60,
  91,  92,  93,  94,  95,  96,  97,  98,
  99,   6,  14,  26,  36,  48,  66, 100,
  101, 102, 103, 104, 105, 106, 107, 108,
  109,   8,  19,  34,  44,  57,  78, 110,
  111, 112, 113, 114, 115, 116, 117, 118,
  119,   9,  27,  39,  52,  61,  79, 120,
  121, 122, 123, 124, 125, 126, 127, 128,
  129,  11,  28,  41,  53,  64,  80, 130,
  131, 132, 133, 134, 135, 136, 137, 138,
  139,  13,  33,  46,  63,  72, 140, 141,
  142, 143, 144, 145, 146, 147, 148, 149,
  150,  15,  35,  47,  65,  69, 151, 152,
  153, 154, 155, 156, 157, 158, 159, 160,
  161,  16,  37,  51,  62,  74, 162, 163,
  164, 165, 166, 167, 168, 169, 170, 171,
  172,  18,  38,  50,  59,  75, 173, 174,
  175, 176, 177, 178, 179, 180, 181, 182,
  183,  20,  40,  54,  76,  82, 184, 185,
  186, 187, 188, 189, 190, 191, 192, 193,
  194,  23,  42,  55,  77, 195, 196, 197,
  198, 199, 200, 201, 202, 203, 204, 205,
  206,  24,  45,  56,  70, 207, 208, 209,
  210, 211, 212, 213, 214, 215, 216, 217,
  218,  25,  49,  58,  71, 219, 220, 221,
  222, 223, 224, 225, 226, 227, 228, 229,
  230,  29,  67,  81, 231, 232, 233, 234,
  235, 236, 237, 238, 239, 240, 241, 242,
  21,  30,  73, 243, 244, 245, 246, 247,
  248, 249, 250, 251, 252, 253, 254, 255
);

function ACBlockProcessor() {
  this.Reset=function() {
    this.prev_num_nzeros_[0] = this.prev_num_nzeros_[1] = this.prev_num_nzeros_[2] = 0;
  }
    this.Reset=function() {
    for (var c = 0; c < 3; ++c) {
      memcpy(this.order_, c * 64, kNaturalCoeffOrder, 0, 64);// * sizeof(order_[0]
    }
  }
	
  this.num_contexts=function() { return 408; }

  this.order_=new mallocArr(192,0);
  this.prev_num_nzeros_=new mallocArr(3,0);
}