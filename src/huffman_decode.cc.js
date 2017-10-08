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
var kCodeLengthCodes = 18;
var kCodeLengthCodeOrder = new Array(
  1, 2, 3, 4, 0, 5, 17, 6, 16, 7, 8, 9, 10, 11, 12, 13, 14, 15
);
var kDefaultCodeLength = 8;
var kCodeLengthRepeatCode = 16;

/* Returns reverse(reverse(key, len) + 1, len), where reverse(key, len) is the
   bit-wise reversal of the len least significant bits of key. */
function GetNextKey(key, len) {
  var step = 1 << (len - 1);
  while (key & step) {
    step >>= 1;
  }
  return (key & (step - 1)) + step;
}

/* Stores code in table[0], table[step], table[2*step], ..., table[end] */
/* Assumes that end is an integer multiple of step */
function ReplicateValue(table, table_off, step, end,
                        code) {
  do {
    end -= step;
    table[table_off+end].bits = code.bits;
    table[table_off+end].value = code.value;
  } while (end > 0);
}

/* Returns the table width of the next 2nd level table. count is the histogram
   of bit lengths for the remaining symbols, len is the code length of the next
   processed symbol */
function NextTableBitSize(count, len,
                          root_bits) {
  var left = 1 << (len - root_bits);
  while (len < kHuffmanMaxLength) {
    left -= count[len];
    if (left <= 0) break;
    ++len;
    left <<= 1;
  }
  return len - root_bits;
}

/* Builds Huffman lookup table assuming code lengths are in symbol order. */
/* Returns false in case of error (invalid tree or memory error). */
function BuildHuffmanTable(root_table,root_table_off,
                      root_bits,
                      code_lengths,code_lengths_off,
                      code_lengths_size,
                      count,count_off) {
  var code=new HuffmanCode();    /* current table entry */
  var table=new Array(new HuffmanCode());//*  /* next available space in table */
  var table_off=0;
  var len;             /* current code length */
  var symbol;     /* symbol index in original or sorted table */
  var key;             /* reversed prefix code */
  var step;            /* step size to replicate values in current table */
  var low;             /* low bits for current root entry */
  var mask;            /* mask for low bits */
  var table_bits;      /* key length of current table */
  var table_size;      /* size of current table */
  var total_size;      /* sum of root table size and 2nd level table sizes */
  /* symbols sorted by code length */
  var sorted=new mallocArr(code_lengths_size,0);
  /* offsets in sorted table for each length */
  var offset=new mallocArr(kHuffmanMaxLength + 1,0);
  var max_length = 1;

  /* generate offsets into sorted symbol table by code length */
  {
    var sum = 0;
    for (len = 1; len <= kHuffmanMaxLength; len++) {
      offset[len] = sum;
      if (count[len]) {
        sum = (sum + count[len]);
        max_length = len;
      }
    }
  }

  /* sort symbols by length, by symbol order within each length */
  for (symbol = 0; symbol < code_lengths_size; symbol++) {
    if (code_lengths[symbol] != 0) {
      sorted[offset[code_lengths[symbol]]++] = symbol;
    }
  }

  table = root_table;
  table_off = root_table_off;
  table_bits = root_bits;
  table_size = 1 << table_bits;
  total_size = table_size;

  /* special case code with only one value */
  if (offset[kHuffmanMaxLength] == 1) {
    code.bits = 0;
    code.value = (sorted[0]);
    for (key = 0; key < total_size; ++key) {
      table[table_off+key] = code;
    }
    return total_size;
  }

  /* fill in root table */
  /* let's reduce the table size to a smaller size if possible, and */
  /* create the repetitions by memcpy if possible in the coming loop */
  if (table_bits > max_length) {
    table_bits = max_length;
    table_size = 1 << table_bits;
  }
  key = 0;
  symbol = 0;
  code.bits = 1;
  step = 2;
  do {
    for (; count[code.bits] != 0; --count[code.bits]) {
      code.value = (sorted[symbol++]);
      ReplicateValue(table,table_off+key, step, table_size, code);
      key = GetNextKey(key, code.bits);
    }
    step <<= 1;
  } while (++code.bits <= table_bits);

  /* if root_bits != table_bits we only created one fraction of the */
  /* table, and we need to replicate it now. */
  while (total_size != table_size) {
    //memcpy(&table[table_size], &table[0], table_size * sizeof(table[0]));
	for(var i=0;i<table_size;++i) {
		table[table_off+table_size+i].bits=table[table_off+0+i].bits;
		table[table_off+table_size+i].value=table[table_off+0+i].value;
	}
    table_size <<= 1;
  }

  /* fill in 2nd level tables and add pointers to root table */
  mask = total_size - 1;
  low = -1;
  for (len = root_bits + 1, step = 2; len <= max_length; ++len, step <<= 1) {
    for (; count[len] != 0; --count[len]) {
      if ((key & mask) != low) {
        table_off += table_size;
        table_bits = NextTableBitSize(count, len, root_bits);
        table_size = 1 << table_bits;
        total_size += table_size;
        low = key & mask;
        root_table[root_table_off+low].bits = (table_bits + root_bits);
        root_table[root_table_off+low].value =
            ((table_off - root_table_off) - low);
      }
      code.bits = (len - root_bits);
      code.value = (sorted[symbol++]);
      ReplicateValue(table,table_off+(key >> root_bits), step, table_size, code);
      key = GetNextKey(key, len);
    }
  }

  return total_size;
}

// Decodes a number in the range [0..65535], by reading 1 - 20 bits.
function DecodeVarLenUint16(input) {
  if (input.ReadBits(1)) {
    var nbits = (input.ReadBits(4));
    if (nbits == 0) {
      return 1;
    } else {
      return (input.ReadBits(nbits)) + (1 << nbits);
    }
  }
  return 0;
}

HuffmanDecodingData.prototype.ReadHuffmanCodeLengths=function(
    code_length_code_lengths,
    code_lengths,
    input) {
  var prev_code_len = kDefaultCodeLength;
  var repeat = 0;
  var repeat_code_len = 0;
  var space = 32768;
  var table=new mallocArrOI(32,HuffmanCode);var table_off=0;

  var counts = mallocArr(16, 0);
  for (var i = 0; i < kCodeLengthCodes; ++i) {
    ++counts[code_length_code_lengths[i]];
  }
  if (!BuildHuffmanTable(table, table_off, 5,
                         code_length_code_lengths,0,
                         kCodeLengthCodes, counts,0)) {
    return 0;
  }

  var max_num_symbols = 1 << 16;
  for(var i=code_lengths.length;i<256;++i) {
	  code_lengths[i]=0;
  }
  code_lengths.length=256;var code_lengths_pos=0;
  while (code_lengths.length < max_num_symbols && space > 0) {
    var p = table;var p_off = table_off;
    var code_len;
    input.FillBitBuffer();
    p_off += input.PeekFixedBits(5);
    input.Advance(p[p_off].bits);
    code_len = (p[p_off].value);
    if (code_len < kCodeLengthRepeatCode) {
      repeat = 0;
      code_lengths[code_lengths_pos++]=(code_len);
      if (code_len != 0) {
        prev_code_len = code_len;
        space -= 32768 >> code_len;
      }
    } else {
      var extra_bits = code_len - 14;
      var old_repeat;
      var repeat_delta;
      var new_len = 0;
      if (code_len == kCodeLengthRepeatCode) {
        new_len =  prev_code_len;
      }
      if (repeat_code_len != new_len) {
        repeat = 0;
        repeat_code_len = new_len;
      }
      old_repeat = repeat;
      if (repeat > 0) {
        repeat -= 2;
        repeat <<= extra_bits;
      }
      var next_repeat = input.ReadBits(extra_bits) + 3;
      repeat += next_repeat;
      repeat_delta = repeat - old_repeat;
      if (code_lengths.length + repeat_delta > max_num_symbols) {
        return 0;
      }
      for (var i = 0; i < repeat_delta; ++i) {
        code_lengths[code_lengths_pos++]=(repeat_code_len);
      }
      if (repeat_code_len != 0) {
        space -= repeat_delta << (15 - repeat_code_len);
      }
    }
  }
  if (space != 0) {
    return 0;
  }
  return 1;
}

HuffmanDecodingData.prototype.ReadFromBitStream = function(input) {
  var ok = 1;
  var table_size = 0;
  var simple_code_or_skip;

  var code_lengths=new Array();
  /* simple_code_or_skip is used as follows:
     1 for simple code;
     0 for no skipping, 2 skips 2 code lengths, 3 skips 3 code lengths */
  simple_code_or_skip = input.ReadBits(2);
  if (simple_code_or_skip == 1) {
    /* Read symbols, codes & code lengths directly. */
    var i;
    var symbols = mallocArr(4, 0);
    var max_symbol = 0;
    var num_symbols = input.ReadBits(2) + 1;
    for (i = 0; i < num_symbols; ++i) {
      symbols[i] = DecodeVarLenUint16(input);
      if (symbols[i] > max_symbol) max_symbol = symbols[i];
    }
    code_lengths=mallocArr(max_symbol + 1,0);
    code_lengths[symbols[0]] = 1;
    for (i = 1; i < num_symbols; ++i) {
      code_lengths[symbols[i]] = 2;
    }
    switch (num_symbols) {
      case 1:
        break;
      case 3:
        ok = ((symbols[0] != symbols[1]) &&
              (symbols[0] != symbols[2]) &&
              (symbols[1] != symbols[2]));
        break;
      case 2:
        ok = (symbols[0] != symbols[1]);
        code_lengths[symbols[1]] = 1;
        break;
      case 4:
        ok = ((symbols[0] != symbols[1]) &&
              (symbols[0] != symbols[2]) &&
              (symbols[0] != symbols[3]) &&
              (symbols[1] != symbols[2]) &&
              (symbols[1] != symbols[3]) &&
              (symbols[2] != symbols[3]));
        if (input.ReadBits(1)) {
          code_lengths[symbols[2]] = 3;
          code_lengths[symbols[3]] = 3;
        } else {
          code_lengths[symbols[0]] = 2;
        }
        break;
    }
  } else {  /* Decode Huffman-coded code lengths. */
    var i;
    var code_length_code_lengths = mallocArr(kCodeLengthCodes, 0);
    var space = 32;
    var num_codes = 0;
    /* Static Huffman code for the code length code lengths */
    var huff = new Array(
      new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(3, 2), new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(4, 1),
      new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(3, 2), new HuffmanCode(2, 0), new HuffmanCode(2, 4), new HuffmanCode(2, 3), new HuffmanCode(4, 5)
    );
    for (i = simple_code_or_skip; i < kCodeLengthCodes && space > 0; ++i) {
      var code_len_idx = kCodeLengthCodeOrder[i];
      var p = huff;var p_off = 0;//HuffmanCode*
      var v;
      input.FillBitBuffer();
      p_off += input.PeekFixedBits(4);
      input.Advance(p[p_off].bits);
      v = (p[p_off].value);//uint8_t
      code_length_code_lengths[code_len_idx] = v;
      if (v != 0) {
        space -= (32 >> v);
        ++num_codes;
      }
    }
    ok = (num_codes == 1 || space == 0) &&
        this.ReadHuffmanCodeLengths(code_length_code_lengths,
                               code_lengths, input);
  }
  var counts = mallocArr(16, 0);
  for (var i = 0; i < code_lengths.length; ++i) {
    ++counts[code_lengths[i]];
  }
  if (ok) {
    table_size = BuildHuffmanTable(this.table_,0, kHuffmanTableBits,
                                   code_lengths,0, code_lengths.length,
                                   counts,0);
    this.table_.length=(table_size);
  }
  return (table_size > 0);
}
