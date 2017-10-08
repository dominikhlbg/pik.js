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
var kHuffmanMaxLength = 15;
var kHuffmanTableMask = 0xff;
var kHuffmanTableBits = 8;
var kMaxHuffmanTableSize = 2048;

function HuffmanCode(bits=0,value=0) {
  this.bits=bits;     /* number of bits used for this symbol */
  this.value=value;   /* symbol value or table offset */
} ;

function  HuffmanDecodingData() {
  this.table_= mallocArrOI(kMaxHuffmanTableSize,HuffmanCode);
}

function HuffmanDecoder() {
  // Decodes the next Huffman coded symbol from the bit-stream.
  this.ReadSymbol=function(code, input) {
    var nbits;
    var table = code.table_;var table_off=0;//*
    input.FillBitBuffer();
    table_off += input.PeekFixedBits(kHuffmanTableBits);
    nbits = table[table_off].bits - kHuffmanTableBits;
    if (nbits > 0) {
      input.Advance(kHuffmanTableBits);
      table_off += table[table_off].value;
      table_off += input.PeekBits(nbits);
    }
    input.Advance(table[table_off].bits);
    return table[table_off].value;
  }
}