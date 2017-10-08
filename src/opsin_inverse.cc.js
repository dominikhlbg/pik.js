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
function NewOpsinToSrgb8Table(bias) {
  var table = new Array();//[4096];
  for (var i = 0; i < 4096; ++i) {
    table[i] = Math.round(
        Math.min(255.0, Math.max(0.0, OpsinToSrgb8Direct(i / 16.0) + bias)));
  }
  return table;
}

function OpsinToSrgb8TablePlusQuarter() {
  var kOpsinToSrgb8TablePlusQuarter =
      NewOpsinToSrgb8Table(0.25);
  return kOpsinToSrgb8TablePlusQuarter;
}
function OpsinToSrgb8TableMinusQuarter() {
  var kOpsinToSrgb8TableMinusQuarter =
      NewOpsinToSrgb8Table(-0.25);
  return kOpsinToSrgb8TableMinusQuarter;
}

