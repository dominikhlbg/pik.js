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
function ReadHistogram(precision_bits, counts,
                   input) {
  var simple_code = input.ReadBits(1);
  if (simple_code == 1) {
    var i;
    var symbols = mallocArr(2, 0);
    var max_symbol = 0;
    var num_symbols = input.ReadBits(1) + 1;
    for (i = 0; i < num_symbols; ++i) {
      symbols[i] = DecodeVarLenUint16(input);
      if (symbols[i] > max_symbol) max_symbol = symbols[i];
    }
	for(var i=counts.length;i<(max_symbol + 1);++i) {
		counts[i]=0;
	}
    if (num_symbols == 1) {
      counts[symbols[0]] = 1 << precision_bits;
    } else {
      if (symbols[0] == symbols[1]) {  // corrupt data
        return false;
      }
      counts[symbols[0]] = input.ReadBits(precision_bits);
      counts[symbols[1]] = (1 << precision_bits) - counts[symbols[0]];
    }
  } else {
    var length = DecodeVarLenUint16(input) + 3;
    for(var i=counts.length;i<(length);++i) {
		counts[i]=0;
	}
    var total_count = 0;
    var huff = [
      [2, 6], [3, 7], [3, 4], [4, 1], [2, 6], [3, 8], [3, 5], [4, 3],
      [2, 6], [3, 7], [3, 4], [4, 2], [2, 6], [3, 8], [3, 5], [5, 0],
      [2, 6], [3, 7], [3, 4], [4, 1], [2, 6], [3, 8], [3, 5], [4, 3],
      [2, 6], [3, 7], [3, 4], [4, 2], [2, 6], [3, 8], [3, 5], [6, 9],
      [2, 6], [3, 7], [3, 4], [4, 1], [2, 6], [3, 8], [3, 5], [4, 3],
      [2, 6], [3, 7], [3, 4], [4, 2], [2, 6], [3, 8], [3, 5], [5, 0],
      [2, 6], [3, 7], [3, 4], [4, 1], [2, 6], [3, 8], [3, 5], [4, 3],
      [2, 6], [3, 7], [3, 4], [4, 2], [2, 6], [3, 8], [3, 5], [6, 10]
    ];
	for(var i=0;i<64;++i) huff[i]=new HuffmanCode(huff[i][0],huff[i][1]);
    var logcounts=mallocArr(counts.length,0);
    var omit_log = -1;
    var omit_pos = -1;
    for (var i = 0; i < logcounts.length; ++i) {
      var p = huff;var p_off = 0;
      input.FillBitBuffer();
      p_off += input.PeekFixedBits(6);
      input.Advance(p[p_off].bits);
      logcounts[i] = p[p_off].value;
      if (logcounts[i] > omit_log) {
        omit_log = logcounts[i];
        omit_pos = i;
      }
    }
    for (var i = 0; i < logcounts.length; ++i) {
      var code = logcounts[i];
      if (i == omit_pos) {
        continue;
      } else if (code == 0) {
        continue;
      } else if (code == 1) {
        counts[i] = 1;
      } else {
        var bitcount = GetPopulationCountPrecision(code - 1);
        counts[i] = (1 << (code - 1)) +
            (input.ReadBits(bitcount) << (code - 1 - bitcount));
      }
      total_count += counts[i];
    }
    PIK_ASSERT(omit_pos >= 0);
    counts[omit_pos] = (1 << precision_bits) - total_count;
    if (counts[omit_pos] <= 0) {
      // The histogram we've read sums to more than total_count (including at
      // least 1 for the omitted value).
      return false;
    }
  }
  return true;
}

