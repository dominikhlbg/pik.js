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
function MoveToFront(v, index) {
  var value = v[index];
  var i = index;
  for (; i; --i) v[i] = v[i - 1];
  v[0] = value;
}

function InverseMoveToFrontTransform(v, v_off, v_len) {
  var mtf=mallocArr(256,0);
  var i;
  for (i = 0; i < 256; ++i) {
    mtf[i] = i;
  }
  for (i = 0; i < v_len; ++i) {
    var index = v[v_off+i];
    v[v_off+i] = mtf[index];
    if (index) MoveToFront(mtf, index);
  }
}

// Decodes a number in the range [0..255], by reading 1 - 11 bits.
function DecodeVarLenUint8(input) {
  if (input.ReadBits(1)) {
    var nbits = (input.ReadBits(3));
    if (nbits == 0) {
      return 1;
    } else {
      return (input.ReadBits(nbits)) + (1 << nbits);
    }
  }
  return 0;
}

function DecodeContextMap(context_map,
                      num_htrees,
                      input) {
  num_htrees[0] = DecodeVarLenUint8(input) + 1;//*

  if (num_htrees[0] <= 1) {
    memset(context_map,0, 0, context_map.length);
    return true;
  }

  var max_run_length_prefix = 0;
  var use_rle_for_zeros = input.ReadBits(1);
  if (use_rle_for_zeros) {
    max_run_length_prefix = input.ReadBits(4) + 1;
  }
  var table=mallocArrOI(kMaxHuffmanTableSize,HuffmanCode);
  var entropy=new HuffmanDecodingData();
  if (!entropy.ReadFromBitStream(input)) {
    return false;
  }
  var decoder=new HuffmanDecoder();
  var i;
  for (i = 0; i < context_map.length;) {
    var code;
    code = decoder.ReadSymbol(entropy, input);
    if (code == 0) {
      context_map[i] = 0;
      ++i;
    } else if (code <= max_run_length_prefix) {
      var reps = 1 + (1 << code) + input.ReadBits(code);
      while (--reps) {
        if (i >= context_map.length) {
          return false;
        }
        context_map[i] = 0;
        ++i;
      }
    } else {
      context_map[i] = (code - max_run_length_prefix);
      ++i;
    }
  }
  if (input.ReadBits(1)) {
    InverseMoveToFrontTransform(context_map,0, context_map.length);
  }
  return true;
}

