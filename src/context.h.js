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
var kNonzeroBuckets = [
   0,   1,   2,   3,   4,   4,   5,   5,   5,   6,   6,   6,   6,   7,   7,   7,
   7,   7,   7,   7,   7,   8,   8,   8,   8,   8,   8,   8,   8,   8,   8,   8,
   9,   9,   9,   9,   9,   9,   9,   9,   9,   9,   9,   9,   9,  10,  10,  10,
  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10,  10
];
var kNumNonzeroBuckets = 11;

var kFreqContext = [
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],

  [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
    0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,
    1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,
    1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  0,  0 ],

  [ 0,  1,  1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2,  2,
    2,  2,  2,  2,  2,  2,  2,  2,  2,  2,  3,  3,  3,  3,  3,  3,
    3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,
    3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  1,  1,  1 ],

  [ 0,  1,  1,  2,  2,  2,  3,  3,  3,  3,  4,  4,  4,  4,  4,  4,
    5,  5,  5,  5,  5,  5,  5,  5,  6,  6,  6,  6,  6,  6,  6,  6,
    6,  6,  6,  6,  6,  6,  6,  6,  7,  7,  7,  7,  7,  7,  7,  7,
    7,  7,  7,  7,  7,  7,  7,  7,  7,  7,  7,  7,  7,  2,  2,  2 ],

  [ 0,  1,  2,  3,  4,  4,  5,  5,  6,  6,  7,  7,  8,  8,  8,  8,
    9,  9,  9,  9, 10, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12,
   13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14,
   15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15 ],

  [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
   16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23,
   24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27,
   28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30, 31, 31, 31, 31 ],

  [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
   16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
   32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
   48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63 ]
];

var kNumNonzeroContext = [
 [ 0,   1,   1,   2,   2,   2,   3,   3,   3,   3,   4,   4,   4,   4,   4,   4,
   5,   5,   5,   5,   5,   5,   5,   5,   6,   6,   6,   6,   6,   6,   6,   6,
   6,   6,   6,   6,   6,   6,   6,   6,   7,   7,   7,   7,   7,   7,   7,   7,
   7,   7,   7,   7,   7,   7,   7,   7,   7,   7,   7,   7,   7,   7,   7,   7
 ],
 [ 0,   2,   2,   4,   4,   4,   6,   6,   6,   6,   8,   8,  8,   8,   8,   8,
  10,  10,  10,  10,  10,  10,  10,  10,  12,  12,  12,  12,  12,  12,  12,  12,
  12,  12,  12,  12,  12,  12,  12,  12,  14,  14,  14,  14,  14,  14,  14,  14,
  14,  14,  14,  14,  14,  14,  14,  14,  14,  14,  14,  14,  14,  14,  14,  14
 ],
 [ 0,   4,   4,   8,   8,   8,  12,  12,  12,  12,  16,  16,  16,  16,  16,  16,
  20,  20,  20,  20,  20,  20,  20,  20,  24,  24,  24,  24,  24,  24,  24,  24,
  24,  24,  24,  24,  24,  24,  24,  24,  28,  28,  28,  28,  28,  28,  28,  28,
  28,  28,  28,  28,  28,  28,  28,  28,  28,  28,  28,  28,  28,  28,  28,  28
 ],
 [ 0,   8,   8,  16,  16,  16,  24,  24,  24,  24,  32,  32,  32,  32,  32,  32,
  40,  40,  40,  40,  40,  40,  40,  40,  48,  48,  48,  48,  48,  48,  48,  48,
  48,  48,  48,  48,  48,  48,  48,  48,  55,  55,  55,  55,  55,  55,  55,  55,
  55,  55,  55,  55,  55,  55,  55,  55,  55,  55,  55,  55,  55,  55,  55,  55
 ],
 [ 0,  16,  16,  32,  32,  32,  48,  48,  48,  48,  64,  64,  64,  64,  64,  64,
  80,  80,  80,  80,  80,  80,  80,  80,  95,  95,  95,  95,  95,  95,  95,  95,
  95,  95,  95,  95,  95,  95,  95,  95, 109, 109, 109, 109, 109, 109, 109, 109,
 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109, 109
 ],
 [ 0,  32,  32,  64,  64,  64,  96,  96,  96,  96, 127, 127, 127, 127, 127, 127,
 157, 157, 157, 157, 157, 157, 157, 157, 185, 185, 185, 185, 185, 185, 185, 185,
 185, 185, 185, 185, 185, 185, 185, 185, 211, 211, 211, 211, 211, 211, 211, 211,
 211, 211, 211, 211, 211, 211, 211, 211, 211, 211, 211, 211, 211, 211, 211, 211
 ],
 [ 0,  64,  64, 127, 127, 127, 188, 188, 188, 188, 246, 246, 246, 246, 246, 246,
 300, 300, 300, 300, 300, 300, 300, 300, 348, 348, 348, 348, 348, 348, 348, 348,
 348, 348, 348, 348, 348, 348, 348, 348, 388, 388, 388, 388, 388, 388, 388, 388,
 388, 388, 388, 388, 388, 388, 388, 388, 388, 388, 388, 388, 388, 388, 388, 388
 ]
];

var kNumNonzeroContextSkip = [
  8, 15, 31, 61, 120, 231, 412
];

function ZeroDensityContext(nonzeros_left, k, bits) {
  return kNumNonzeroContext[bits][nonzeros_left] + kFreqContext[bits][k];
}

