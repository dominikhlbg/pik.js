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
function FindValueAndRemove(idx, s, s_off, len) {
  var pos = 0;
  var val = 0;
  for (var i = 0; i < len; ++i) {
    if (s[s_off+i] == -1) continue;
    if (pos == idx) {
      val = s[s_off+i];
      s[s_off+i] = -1;
      break;
    }
    ++pos;
  }
  return val;
}

function DecodeLehmerCode(code, len, sigma, sigma_off) {
  var stdorder=new mallocArr(len,0);
  for (var i = 0; i < len; ++i) {
    stdorder[i] = i;
  }
  for (var i = 0; i < len; ++i) {
    sigma[sigma_off+i] = FindValueAndRemove(code[i], stdorder,0, len);
  }
}

