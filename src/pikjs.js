"use strict";
window['PIKdecoder'] = function() {
/*onmessage =  function(evt) {
var height=[0];
var width=[0];
var result = evt.data;
var response = result.response;
var start=new Date();
var rgba = WebPDecodeRGBA(response,0,response.length,width,height);
var speed = ((new Date())-start);
var transferspeed = new Date();
var data = {'rgba':rgba,'width':width,'height':height,'speed':speed,'transferspeed':transferspeed,'thread':result.thread};
postMessage(data,[data.rgba.buffer]);
};*/
function PIK_FAILURE() {
}

function assert(bCondition) {
	if (!bCondition) {
		throw new Error('assert :P');
	}
}

function static_assert(bCondition,str) {
	if (!bCondition) {
		throw new Error(str);
	}
}

function memcmp(data, data_off, str, size) {
	for(var i=0;i<size;i++)
		if(data[data_off+i]!=str.charCodeAt(i))
			return true;
	return false;
}

function memcpy(dest,dest_off,src,src_off,num) {
/*	if(typeof src.BYTES_PER_ELEMENT==='undefined')
	dest=dest;
	dest.set(src.subarray(src_off,src_off+num),dest_off);*/
	for(var i=0;i<num;i++) {
		//if(typeof dest[dest_off+i]!=='number'||typeof src[src_off+i]!=='number')
		//dest=dest;
		//assert(typeof dest[dest_off+i]==='number');
		//assert(typeof src[src_off+i]==='number');
		dest[dest_off+i]=src[src_off+i];
	}
}

function memset(ptr,ptr_off,value,num) {
	for(var i=0;i<num;i++)
		ptr[ptr_off+i]=value;
}
function mallocArr(size,value) {
	var arr=new Array();
	for(var i=0;i<size;i++)
	arr.push(value);
	return arr;
}

function mallocArrOI(size,value) {
	var arr=new Array();
	for(var i=0;i<size;i++)
	arr.push(new value());
	return arr;
}

function mallocMArr(size,value) {
	function buildarray(arr,sub,counts) { 
		var l=counts[sub];
		for(var i=0;i<l;i++) {
			arr.push((counts.length>sub+1)?new Array():value);
			if(counts.length<sub+1) return;
			buildarray(arr[i],sub+1,counts);
		}
	}
	var arr=new Array();
	buildarray(arr,0,size);
	return arr;
}

function mallocMArrOI(size,value) {
	function buildarray(arr,sub,counts) { 
		var l=counts[sub];
		for(var i=0;i<l;i++) {
			arr.push((counts.length>sub+1)?new Array():new value());
			if(counts.length<sub+1) return;
			buildarray(arr[i],sub+1,counts);
		}
	}
	var arr=new Array();
	buildarray(arr,0,size);
	return arr;
}
function memmove(destination, destination_off, source, source_off, num) {
	//copy from last to start
	var i; var temp=[];
	for(i=num-1;i>=0;--i) {
		temp[i]=source[source_off+i];
	}
	for(i=num-1;i>=0;--i) {
		destination[destination_off+i]=temp[i];
	}
}

function GetEL32(data,data_off) {
  return ((data[data_off+3] << 0) | (data[data_off+2] << 8) | (data[data_off+1] << 16) | (data[data_off+0] << 24))>>>0;
}

function GetLE32(data,data_off) {
  return ((data[data_off+0] << 0) | (data[data_off+1] << 8) | (data[data_off+2] << 16) | (data[data_off+3] << 24))>>>0;
}

var ANS_LOG_TAB_SIZE = 10;
var ANS_TAB_SIZE = (1 << ANS_LOG_TAB_SIZE);
var ANS_TAB_MASK = (ANS_TAB_SIZE - 1);
var ANS_SIGNATURE = 0x13;    // Initial state, used as CRC.

var kVectorSize = 32;  // AVX-2
function CacheAligned() {
  this.kCacheLineSize = 64;
}

function AllocateArray(size) {
	return new Int16Array(size);// mallocArr(size,0);
}function BitReader(data, data_off, len) {
  this.data8_=data,
  this.data8_off=data_off,
  this.len8_=len,
  this.val_=((data[data_off+0] << 0) | (data[data_off+1] << 8) | (data[data_off+2] << 16) | (data[data_off+3] << 24))>>>0,
  this.pos8_=4,
  this.bit_pos_=0;
  //PIK_ASSERT(len % 32 == 0);

  this.FillBitBuffer=function() {
    if ((this.bit_pos_ >= 8)) {
      this.val_ >>>= 8;
      if (this.pos8_ < this.len8_) {
        this.val_ += ((this.data8_[this.data8_off+this.pos8_+0]) << 24)>>>0;
      }
      this.pos8_+=1;
      this.bit_pos_ -= 8;
    }
  }

  this.Advance=function(num_bits) {if(num_bits+this.bit_pos_>=32) console.log(this.bit_pos_);
    this.bit_pos_ += num_bits;
  }

  this.PeekFixedBits=function(N) {
	  this.FillBitBuffer();if(N+this.bit_pos_>=32) console.log(this.bit_pos_);
    static_assert(N <= 30, "At most 30 bits may be read.");
    return (this.val_ >>> this.bit_pos_) & ((1 << N) - 1);
  }

  this.PeekBits=function(nbits) {this.FillBitBuffer();if(nbits+this.bit_pos_>=32) console.log(this.bit_pos_);
    return (this.val_ >>> this.bit_pos_) & ((1 << nbits) - 1);
  }
  // Returns the byte position, aligned to 4 bytes, where the next chunk of
  // data should be read from after all symbols have been decoded.
  this.Position=function() {
    var bits_read = 8 * this.pos8_ + this.bit_pos_ - 32;
    var bytes_read = (bits_read + 7) / 8;
    return (bytes_read + 3) & ~3;
  }

  this.ReadBits=function(nbits) {
    this.FillBitBuffer();
    var bits = this.PeekBits(nbits);
    this.bit_pos_ += nbits;
    return bits;
  }

}
var kGlobalScaleDenom = 1 << 16;
var kQuantMax = 256;
var kDefaultQuant = 64;

function Quantizer() {
this._=function(quant_xsize, quant_ysize, coeffs_per_block,
                   dequant_matrix) {
    this.quant_xsize_=(quant_xsize),
    this.quant_ysize_=(quant_ysize),
    this.coeffs_per_block_=(coeffs_per_block),
    this.dequant_matrix_=(dequant_matrix),
    this.global_scale_=(kGlobalScaleDenom / kDefaultQuant),
    this.quant_dc_=(kDefaultQuant),
    this.quant_img_ac_=new Image_(),this.quant_img_ac_._3(this.quant_xsize_, this.quant_ysize_, kDefaultQuant),
    this.scale_=new Image3F(),this.scale_._2(this.quant_xsize_ * this.coeffs_per_block_, this.quant_ysize_),
    this.initialized_=(false);
}
this.Decode=function(data, data_off, len) {
  var pos = 0;
  this.global_scale_ = data[data_off+(pos++)] << 8;
  this.global_scale_ += data[data_off+(pos++)];
  this.quant_dc_ = data[data_off+(pos++)] + 1;
  pos += DecodePlane(data,data_off + pos, len - pos, 1, kQuantMax, this.quant_img_ac_);
  this.inv_global_scale_ = kGlobalScaleDenom * 1.0 / this.global_scale_;
  this.inv_quant_dc_ = this.inv_global_scale_ / this.quant_dc_;
  this.initialized_ = true;
  return pos;
}

}  Quantizer.prototype.inv_quant_dc=function() { return this.inv_quant_dc_; }
  Quantizer.prototype.inv_quant_ac=function(quant_x, quant_y) {
    return this.inv_global_scale_ / this.quant_img_ac_.Row(quant_y)[this.quant_img_ac_.Row_off(quant_y)+quant_x];
  }
// Returns the precision (number of bits) that should be used to store
// a histogram count such that Log2Floor(count) == logcount.
function GetPopulationCountPrecision(logcount) {
  return (logcount + 1) >>> 1;
}

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
}var Bytes = Array;
var kScale = 255.0;
var kOpsinAbsorbanceInverseMatrix = [
    6.805644286129 * kScale,  -5.552270790544 * kScale,
    -0.253373707795 * kScale, -2.373074275591 * kScale,
    3.349796660147 * kScale,  0.023277709773 * kScale,
    -0.314192274838 * kScale, -0.058176067042 * kScale,
    1.372368367449 * kScale,
];
var kScaleR = 1.001746913108605;
var kScaleG = 2.0 - kScaleR;
var kInvScaleR = 1.0 / kScaleR;
var kInvScaleG = 1.0 / kScaleG;
var kXybCenter = [0.008714601398, 0.5, 0.5];
var kGammaInitialCutoff = 10.31475;
var kGammaInitialSlope = 12.92;
var kGammaOffset = 0.055;
var kGammaPower = 2.4;
function OpsinToSrgb8Direct(val) {
  if (val <= 0.0) {
    return 0.0;
  }
  if (val >= 255.0) {
    return 255.0;
  }
  if (val <= kGammaInitialCutoff / kGammaInitialSlope) {
    return val * kGammaInitialSlope;
  }
  return 255.0 * (Math.pow(val / 255.0, 1.0 / kGammaPower) *
                  (1.0 + kGammaOffset) - kGammaOffset);
}

function XyToR(x, y) {
  return kInvScaleR * (y + x);
}
function XyToG(x, y) {
  return kInvScaleG * (y - x);
}
function SimpleGammaInverse(v) {
  return v * v * v;
}
function MixedToRed(r, g, b) {
  return (kOpsinAbsorbanceInverseMatrix[0] * r +
          kOpsinAbsorbanceInverseMatrix[1] * g +
          kOpsinAbsorbanceInverseMatrix[2] * b);
}

function MixedToGreen(r, g, b) {
  return (kOpsinAbsorbanceInverseMatrix[3] * r +
          kOpsinAbsorbanceInverseMatrix[4] * g +
          kOpsinAbsorbanceInverseMatrix[5] * b);
}

function MixedToBlue(r, g, b) {
  return (kOpsinAbsorbanceInverseMatrix[6] * r +
          kOpsinAbsorbanceInverseMatrix[7] * g +
          kOpsinAbsorbanceInverseMatrix[8] * b);
}
function Clamp(x) {
  return Math.min(255.0, Math.max(0.0, x));
}

// Inverts the pixel-wise RGB->XYB conversion in OpsinDynamicsImage() (including
// the gamma mixing and simple gamma) and clamps the resulting pixel values
// between 0.0 and 255.0.
function XybToRgb(x, y, b,
                  red, green,
                  blue) {
  var r_mix = SimpleGammaInverse(XyToR(x, y));
  var g_mix = SimpleGammaInverse(XyToG(x, y));
  var b_mix = SimpleGammaInverse(b);
  red[0] = Clamp(MixedToRed(r_mix, g_mix, b_mix));
  green[0] = Clamp(MixedToGreen(r_mix, g_mix, b_mix));
  blue[0] = Clamp(MixedToBlue(r_mix, g_mix, b_mix));
}

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

function DecompressParams() {
};
function Image_(T=1) {
  this.xsize_=0;
  this.ysize_=0;
  this.bytes_per_row_=0;
  this.bytes_=null;
  this._2=function(xsize, ysize) {
    this.xsize_=(xsize),
    this.ysize_=(ysize),
    this.bytes_per_row_=(this.BytesPerRow(xsize)),
    this.bytes_=(AllocateArray(this.bytes_per_row_ * ysize));
  }
  this._3=function(xsize, ysize, val) {
    this.xsize_=(xsize),
    this.ysize_=(ysize),
    this.bytes_per_row_=(this.BytesPerRow(xsize)),
    this.bytes_=(AllocateArray(this.bytes_per_row_ * ysize));
    for (var y = 0; y < this.ysize_; ++y) {
      var row = this.Row(y);
	  var row_off = this.Row_off(y);
      for (var x = 0; x < this.xsize_; ++x) {
        row[row_off+x] = val;
      }
      // Avoid use of uninitialized values msan error in padding in WriteImage
      memset(row, row_off + this.xsize_, 0, this.bytes_per_row_ - T * this.xsize_);//sizeof(T)
    }
  }

  // Useful for pre-allocating image with some padding for alignment purposes
  // and later reporting the actual valid dimensions.
  this.ShrinkTo=function(xsize, ysize) {
    PIK_ASSERT(xsize < this.xsize_);
    PIK_ASSERT(ysize < this.ysize_);
    this.xsize_ = xsize;
    this.ysize_ = ysize;
  }

  // How many pixels.
  this.xsize=function() { return this.xsize_; }
  this.ysize=function() { return this.ysize_; }

  // Returns pointer to the start of a row, with at least xsize (rounded up to
  // the number of vector lanes) accessible values.
  this.Row=function(y) {
    PIK_ASSERT(y < this.ysize_);
    var row = this.bytes_;// + y * this.bytes_per_row_
    return row;//(PIK_ASSUME_ALIGNED(row, 64));
  }
  this.Row_off=function(y) {
    PIK_ASSERT(y < this.ysize_);
    var row_off = + y * this.bytes_per_row_;//this.bytes_ 
    return row_off;//(PIK_ASSUME_ALIGNED(row, 64));
  }

  // Returns cache-aligned row stride, being careful to avoid 2K aliasing.
  this.BytesPerRow=function(xsize) {assert(xsize>0);
    // lowpass reads one extra AVX-2 vector on the right margin.
    var row_size = xsize * T + kVectorSize;//sizeof(T)
    var align = (new CacheAligned()).kCacheLineSize;
    var bytes_per_row = (row_size + align - 1) & ~(align - 1);
    // During the lengthy window before writes are committed to memory, CPUs
    // guard against read after write hazards by checking the address, but
    // only the lower 11 bits. We avoid a false dependency between writes to
    // consecutive rows by ensuring their sizes are not multiples of 2 KiB.
    if (bytes_per_row % 2048 == 0) {
      bytes_per_row += align;
    }
    return bytes_per_row;
  }

}

function Image3() {
  var Plane = Image_;
	this.planes_=[new Plane(), new Plane(), new Plane()];
	this._2=function(xsize, ysize) {
		this.planes_=[new Plane(), new Plane(), new Plane()];
		this.planes_[0]._2(xsize, ysize);
		this.planes_[1]._2(xsize, ysize);
		this.planes_[2]._2(xsize, ysize);
	}

  // Returns array of row pointers; usage: Row(y)[idx_plane][x] = val.
  this.Row=function(y) {
    return [this.planes_[0].Row(y), this.planes_[1].Row(y), this.planes_[2].Row(y)];
  }
  this.Row_off=function(y) {
    return [this.planes_[0].Row_off(y), this.planes_[1].Row_off(y), this.planes_[2].Row_off(y)];
  }
  this.ShrinkTo=function(xsize, ysize) {
    for (var plane in this.planes_) { this.planes_[plane].ShrinkTo(xsize, ysize); }
  }

  // Sizes of all three images are guaranteed to be equal.
  this.xsize=function() { return this.planes_[0].xsize(); }
  this.ysize=function() { return this.planes_[0].ysize(); }

}

var Image3B = Image3;
var Image3W = Image3;
var Image3U = Image3;
var Image3F = Image3;
var Image3D = Image3;
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
}var kU32Selectors = 0x20181008;

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
}function U32Coder() {
	this.MaxCompressedBits=function() {
    	return 2 + 4 * 8;//sizeof(uint32_t)
	}
  // The four bytes of "selector_bits" (sorted in ascending order from
  // low to high bit indices) indicate how many bits for each selector, or
  // zero if the selector represents the value directly.
  this.Load=function(selector_bits,
            source) {
    if (source.CanRead32()) {
      source.Read32();
    }
    var selector = source.Extract(2);
    var num_bits = NumBits(selector_bits, selector);
    if (num_bits == 0) {
      return selector;
    }
    if (source.CanRead32()) {
      source.Read32();
    }
    return source.ExtractVariableCount(num_bits);
  }

  function NumBits(selector_bits, selector) {
    return (selector_bits >>> (selector * 8)) & 0xFF;
  }
}

function FieldReader(source) {
	this.source_=source;
  this.operator=function(selector_bits,
                  value) {
    value[0] = (new U32Coder()).Load(selector_bits, this.source_);
  }

}

function FieldMaxSize() {
  this.operator=function(selector_bits,
                  value) {
    this.max_bits_ += (new U32Coder()).MaxCompressedBits();
  }
  
  this.MaxBytes = function() { return Math.floor((this.max_bits_ + 7) / 8); }

  this.max_bits_ = 0;
}

function Magic() {
  this.CompressedSize=function() {
    return 4;
  }
  this.Verify=function(source) {
    if (source.CanRead32()) {
      source.Read32();
    }
    for (var i = 0; i < 4; ++i) {
      if (source.Extract(8) != String_(i)) {
        return false;
      }
    }
    return true;
  }

  function String_(pos) {
    // \n causes files opened in text mode to be rejected, and \xCC detects
    // 7-bit transfers (it is also an uppercase I with accent in ISO-8859-1).
    return "P\xCCK\n".charCodeAt(pos);
  }
}

function MaxCompressedHeaderSize() {
  var size = (new Magic()).CompressedSize();

  // Fields
  var max_size=new FieldMaxSize();
  var header=new Header();
  header.VisitFields(max_size);
  size += max_size.MaxBytes();
  return size + 8;  // plus BitSink safety margin.
}

function LoadHeader(source,
                header) {
  if (!(new Magic()).Verify(source)) {
    return PIK_FAILURE("Wrong magic bytes.");
  }

  var reader=new FieldReader(source);
  header.VisitFields(reader);
  return true;
}

function BitSource(from,from_off) {
    var bits=0;//[];
    //memcpy(bits,0, from,0, 8);
	bits=GetEL32(from,0);
    this.buffer_ = bits;// _mm_cvtsi64_si128(PIK_BSWAP64(bits));
    // There are 32 upper bits to extract before reaching the lower bits.
    this.lower_bits_extracted_ = -32;

  this.Extract=function(num_bits) {
    var bits = (this.buffer_ >>> (32 - num_bits))&255;
    var code = bits;//_mm_cvtsi128_si64
    this.buffer_ <<= num_bits;
    this.lower_bits_extracted_ += num_bits;
    return code;
  }

  // (Slightly less efficient code: num_bits is loaded into a vector.)
  this.ExtractVariableCount=function(num_bits) {
    var bits = (this.buffer_ >>> (32 - num_bits));
    var code = bits;//_mm_cvtsi128_si64
    this.buffer_ <<= num_bits;
    this.lower_bits_extracted_ += num_bits;
    return code;
  }

  // Returns whether the buffer has space for reading 32 more bits.
  this.CanRead32=function() { return (this.lower_bits_extracted_ >= 0); }

  // Reads the next 32 bits into the buffer. Precondition: CanRead32 =>
  // lower_bits_extracted_ >= 0 => buffer_[0,32) == 0.
  this.Read32=function() {
    var shift = this.lower_bits_extracted_;//_mm_cvtsi64_si128()
    var bits=0;//[];
    //memcpy(bits,0, this.read_pos_,0, 4);
	bits=GetEL32(this.read_pos_,this.read_pos_off);
    this.read_pos_off += 4;
    var vbits=bits;//(_mm_cvtsi64_si128(PIK_BSWAP32()));
    // The upper half may have had some zeros at the bottom, so match that.
    this.buffer_ += vbits << shift;
    this.lower_bits_extracted_ -= 32;
  }

  // Returns the byte-aligned end position after all extracted bits.
  this.Finalize=function() {
  this.read_pos_off+=4;
    var excess_bytes = ((32 - this.lower_bits_extracted_) / 8)|0;
    return this.read_pos_off - excess_bytes;
  }

  var V = 0;// PIK_TARGET_NAME::V2x64U;
  //this.buffer_=V;
  //this.lower_bits_extracted_=0;
  this.read_pos_=from;
  this.read_pos_off=4;
}function Load(block, block_off) {
	var result=mallocArr(8,0);
	for(var i=0;i<8;++i) {
		result[i]=block[block_off+i];
	}
	return result;
}
function Store(input, block, block_off) {
	for(var i=0;i<8;++i) {
		block[block_off+i]=input[i];
	}
}
function _mm256_unpacklo_ps(a, b) {
	return [a[0],b[0],a[1],b[1],a[4],b[4],a[5],b[5]];
}
function _mm256_unpackhi_ps(a, b) {
	return [a[2],b[2],a[3],b[3],a[6],b[6],a[7],b[7]];
}
function _mm256_permute2f128_ps(a, b, imm8) {
	var result=mallocArr(8,0);
	for(var i=0;i<2;++i) {
		switch((imm8>>i*4)&15) {
			case 0: result[i*4+0]=a[0];result[i*4+1]=a[1];result[i*4+2]=a[2];result[i*4+3]=a[3];
				break;
			case 1: result[i*4+0]=a[4];result[i*4+1]=a[5];result[i*4+2]=a[6];result[i*4+3]=a[7];
				break;
			case 2: result[i*4+0]=b[0];result[i*4+1]=b[1];result[i*4+2]=b[2];result[i*4+3]=b[3];
				break;
			case 3: result[i*4+0]=b[4];result[i*4+1]=b[5];result[i*4+2]=b[6];result[i*4+3]=b[7];
				break;
			default:
				assert(false);
		} 
	}
	return result;
}
function TransposeBlock(block, block_off) {
  //using namespace PIK_TARGET_NAME;
  var p0 = Load(block,block_off+0);
  var p1 = Load(block,block_off+8);
  var p2 = Load(block,block_off+16);
  var p3 = Load(block,block_off+24);
  var p4 = Load(block,block_off+32);
  var p5 = Load(block,block_off+40);
  var p6 = Load(block,block_off+48);
  var p7 = Load(block,block_off+56);
  var q0 = (_mm256_unpacklo_ps(p0, p2));
  var q1 = (_mm256_unpacklo_ps(p1, p3));
  var q2 = (_mm256_unpackhi_ps(p0, p2));
  var q3 = (_mm256_unpackhi_ps(p1, p3));
  var q4 = (_mm256_unpacklo_ps(p4, p6));
  var q5 = (_mm256_unpacklo_ps(p5, p7));
  var q6 = (_mm256_unpackhi_ps(p4, p6));
  var q7 = (_mm256_unpackhi_ps(p5, p7));
  var r0 = (_mm256_unpacklo_ps(q0, q1));
  var r1 = (_mm256_unpackhi_ps(q0, q1));
  var r2 = (_mm256_unpacklo_ps(q2, q3));
  var r3 = (_mm256_unpackhi_ps(q2, q3));
  var r4 = (_mm256_unpacklo_ps(q4, q5));
  var r5 = (_mm256_unpackhi_ps(q4, q5));
  var r6 = (_mm256_unpacklo_ps(q6, q7));
  var r7 = (_mm256_unpackhi_ps(q6, q7));
  Store(_mm256_permute2f128_ps(r0, r4, 0x20), block,block_off+ 0);
  Store(_mm256_permute2f128_ps(r1, r5, 0x20), block,block_off+ 8);
  Store(_mm256_permute2f128_ps(r2, r6, 0x20), block,block_off+16);
  Store(_mm256_permute2f128_ps(r3, r7, 0x20), block,block_off+24);
  Store(_mm256_permute2f128_ps(r0, r4, 0x31), block,block_off+32);
  Store(_mm256_permute2f128_ps(r1, r5, 0x31), block,block_off+40);
  Store(_mm256_permute2f128_ps(r2, r6, 0x31), block,block_off+48);
  Store(_mm256_permute2f128_ps(r3, r7, 0x31), block,block_off+56);
}

function ColumnIDCT(block,block_off) {
  //using namespace PIK_TARGET_NAME;
  var i;
  for (i = 0; i<8; ++i) {
  var i0 = block[block_off+0];
  var i1 = block[block_off+8];
  var i2 = block[block_off+16];
  var i3 = block[block_off+24];
  var i4 = block[block_off+32];
  var i5 = block[block_off+40];
  var i6 = block[block_off+48];
  var i7 = block[block_off+56];
  var c1=1.41421356237310;
  var c2=0.76536686473018;
  var c3=2.61312592975275;
  var c4=1.08239220029239;
  var t00 = i0 + i4;
  var t01 = i0 - i4;
  var t02 = i2 + i6;
  var t03 = i2 - i6;
  var t04 = i1 + i7;
  var t05 = i1 - i7;
  var t06 = i5 + i3;
  var t07 = i5 - i3;
  var t08 = t04 + t06;
  var t09 = t04 - t06;
  var t10 = t00 + t02;
  var t11 = t00 - t02;
  var t12 = t05 + t07;
  var t13 = c2 * t12;
  var t14 = (c1 * t03) - t02;
  var t15 = t01 + t14;
  var t16 = t01 - t14;
  var t17 = (c3 * t05) - t13;
  var t18 = (c4 * t07) + t13;
  var t19 = t17 - t08;
  var t20 = (c1 * t09) - t19;
  var t21 = t18 - t20;
  block[block_off+ 0] = t10 + t08;
  block[block_off+ 8] = t15 + t19;
  block[block_off+16] = t16 + t20;
  block[block_off+24] = t11 + t21;
  block[block_off+32] = t11 - t21;
  block[block_off+40] = t16 - t20;
  block[block_off+48] = t15 - t19;
  block[block_off+56] = t10 - t08;
  block_off += 1;
  }
}

function ComputeTransposedScaledBlockIDCTFloat(block,block_off) {
  ColumnIDCT(block,block_off);
  TransposeBlock(block,block_off);
  ColumnIDCT(block,block_off);
}

// Final scaling factors of outputs/inputs in the Arai, Agui, and Nakajima
// algorithm computing the DCT/IDCT.
// The algorithm is described in the book JPEG: Still Image Data Compression
// Standard, section 4.3.5.
var kIDCTScales = new Array(
  0.3535533906, 0.4903926402, 0.4619397663, 0.4157348062,
  0.3535533906, 0.2777851165, 0.1913417162, 0.0975451610
);

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
}var kANSBufferSize = 1 << 16;

function SignedIntFromSymbol(symbol) {
  return Math.trunc(symbol % 2 == 0 ? symbol / 2 : (-symbol - 1) / 2);
}
function UnpredictDC(coeffs) {
  var dc_y=new Image_();dc_y._2(coeffs.xsize() / 64, coeffs.ysize());
  var dc_xz=new Image_();dc_xz._2(coeffs.xsize() / 64 * 2, coeffs.ysize());

  for (var y = 0; y < coeffs.ysize(); y++) {
    var row = coeffs.Row(y);var row_off = coeffs.Row_off(y);
    var row_y = dc_y.Row(y);var row_y_off = dc_y.Row_off(y);
    var row_xz = dc_xz.Row(y);var row_xz_off = dc_xz.Row_off(y);
    for (var x = 0, block_x = 0; x < coeffs.xsize(); x += 64, block_x++) {
		//for(var i=0;i<4;++i) {
      row_y[row_y_off+block_x] = row[1][row_off[1]+x];

      row_xz[row_xz_off+2 * block_x] = row[0][row_off[0]+x];
      row_xz[row_xz_off+2 * block_x + 1] = row[2][row_off[2]+x];
		//}
    }
  }

  var dc_y_out=new Image_();dc_y_out._2(coeffs.xsize() / 64, coeffs.ysize());
  var dc_xz_out=new Image_();dc_xz_out._2(coeffs.xsize() / 64 * 2, coeffs.ysize());

  ExpandY(dc_y, dc_y_out);
  ExpandUV(dc_y_out, dc_xz, dc_xz_out);

  for (var y = 0; y < coeffs.ysize(); y++) {
    var row_y = dc_y_out.Row(y);var row_y_off = dc_y_out.Row_off(y);
    var row_xz = dc_xz_out.Row(y);var row_xz_off = dc_xz_out.Row_off(y);
    var row_out = coeffs.Row(y);var row_out_off = coeffs.Row_off(y);
    for (var x = 0, block_x = 0; x < coeffs.xsize(); x += 64, block_x++) {
		//for(var i=0;i<4;++i) {
      row_out[1][row_out_off[1]+x] = row_y[row_y_off+block_x];

      row_out[0][row_out_off[0]+x] = row_xz[row_xz_off+2 * block_x];
      row_out[2][row_out_off[2]+x] = row_xz[row_xz_off+2 * block_x + 1];
		//}
    }
  }
}

var kSymbolLut = new Array(
  0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x21, 0x12,
  0x31, 0x41, 0x05, 0x51, 0x13, 0x61, 0x22, 0x71,
  0x81, 0x06, 0x91, 0x32, 0xa1, 0xf0, 0x14, 0xb1,
  0xc1, 0xd1, 0x23, 0x42, 0x52, 0xe1, 0xf1, 0x15,
  0x07, 0x62, 0x33, 0x72, 0x24, 0x82, 0x92, 0x43,
  0xa2, 0x53, 0xb2, 0x16, 0x34, 0xc2, 0x63, 0x73,
  0x25, 0xd2, 0x93, 0x83, 0x44, 0x54, 0xa3, 0xb3,
  0xc3, 0x35, 0xd3, 0x94, 0x17, 0x45, 0x84, 0x64,
  0x55, 0x74, 0x26, 0xe2, 0x08, 0x75, 0xc4, 0xd4,
  0x65, 0xf2, 0x85, 0x95, 0xa4, 0xb4, 0x36, 0x46,
  0x56, 0xe3, 0xa5, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
  0x0e, 0x0f, 0x10, 0x18, 0x19, 0x1a, 0x1b, 0x1c,
  0x1d, 0x1e, 0x1f, 0x20, 0x27, 0x28, 0x29, 0x2a,
  0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x37, 0x38,
  0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f, 0x40,
  0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e,
  0x4f, 0x50, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c,
  0x5d, 0x5e, 0x5f, 0x60, 0x66, 0x67, 0x68, 0x69,
  0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x76,
  0x77, 0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e,
  0x7f, 0x80, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b,
  0x8c, 0x8d, 0x8e, 0x8f, 0x90, 0x96, 0x97, 0x98,
  0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f, 0xa0,
  0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad,
  0xae, 0xaf, 0xb0, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9,
  0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf, 0xc0, 0xc5,
  0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd,
  0xce, 0xcf, 0xd0, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9,
  0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf, 0xe0, 0xe4,
  0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec,
  0xed, 0xee, 0xef, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7,
  0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff
);


function ANSSymbolReader() {
  this.DecodeHistograms=function(num_histograms,
                        symbol_lut, symbol_lut_size,
                        in_) {
	for(var i=this.map_.length;i<(num_histograms << ANS_LOG_TAB_SIZE);++i) this.map_[i]=0;
	for(var i=this.info_.length;i<(num_histograms << 8);++i) this.info_[i]=new this.ANSSymbolInfo();
    for (var c = 0; c < num_histograms; ++c) {
      var counts=new Array();
      ReadHistogram(ANS_LOG_TAB_SIZE, counts, in_);
      PIK_CHECK(counts.length <= 256);
      var offset = 0;
      for (var i = 0, pos = 0; i < counts.length; ++i) {
        var symbol = i;
        if (symbol_lut != null && symbol < symbol_lut_size) {
          symbol = symbol_lut[symbol];
        }
        this.info_[(c << 8) + symbol].offset_ = offset;
        this.info_[(c << 8) + symbol].freq_ = counts[i];
        offset += counts[i];
        for (var j = 0; j < counts[i]; ++j, ++pos) {
          this.map_[(c << ANS_LOG_TAB_SIZE) + pos] = symbol;
        }
      }
    }
  }

  this.ReadSymbol=function(histo_idx, br) {
    if (this.symbols_left_ == 0) {
      this.state_ = br.ReadBits(16);
      this.state_ = ((this.state_ << 16) | br.ReadBits(16))>>>0;
      br.FillBitBuffer();
      this.symbols_left_ = kANSBufferSize;
    }
    var res = this.state_ & (ANS_TAB_SIZE - 1);
    var symbol = this.map_[(histo_idx << ANS_LOG_TAB_SIZE) + res];
    var s = this.info_[(histo_idx << 8) + symbol];//ANSSymbolInfo
    this.state_ = s.freq_ * (this.state_ >>> ANS_LOG_TAB_SIZE) + res - s.offset_;
    --this.symbols_left_;
    if (this.state_ < (1 << 16)) {//u
      this.state_ = ((this.state_ << 16) | br.PeekFixedBits(16))>>>0;
      br.Advance(16);
    }
    return symbol;
  }

  this.CheckANSFinalState=function() { return this.state_ == (ANS_SIGNATURE << 16); }

  this.ANSSymbolInfo=function() {
    this.offset_=0;
    this.freq_=0;
  };
  this.symbols_left_ = 0;
  this.state_ = 0;
  this.map_=new Array();
  this.info_=new Array(new this.ANSSymbolInfo());
}

function DecodeHistograms(data, data_off, len,
                        num_contexts,
                        symbol_lut, symbol_lut_size,
                        decoder,
                        context_map) {
  var in_=new BitReader(data, data_off, len);
  var num_histograms = [1];
  context_map.length=(num_contexts);
  if (num_contexts > 1) {
    DecodeContextMap(context_map, num_histograms, in_);//&
  }
  decoder.DecodeHistograms(num_histograms[0], symbol_lut, symbol_lut_size, in_);
  return in_.Position();
}

function DecodeImageData(data, data_off, len,
                       context_map,
                       stride,
                       decoder,
                       img) {
  var dummy_buffer = mallocArr(4, 0);var dummy_buffer_off=0;
  PIK_CHECK(len >= 4 || len == 0);
  var br=new BitReader(len == 0 ? dummy_buffer : data,len == 0 ? dummy_buffer_off : data_off, len);
  for (var y = 0; y < img.ysize(); ++y) {
    var row = img.Row(y);var row_off = img.Row_off(y);
    for (var x = 0; x < img.xsize(); x += stride) {
      for (var c = 0; c < 3; ++c) {
        br.FillBitBuffer();
        var histo_idx = context_map[c];
        var s = decoder.ReadSymbol(histo_idx, br);
        if (s > 0) {
          var bits = br.PeekBits(s);
          br.Advance(s);
          s = bits < (1 << (s - 1)) ? bits + (((~0) << s )>>>0) + 1 : bits;//U Todo:Works?
          if(s > 0x7fffffff) s -=4294967296;
        }
		
        if(false) {//s>255
		  for(var i=0;i<4;++i) {
            row[c][row_off[c]+x+i] = s>>>(i*8)&255;
          }
        } else {
          row[c][row_off[c]+x] = s;
		}
      }
    }
  }
  return br.Position();
}

function DecodeCoeffOrder(order, order_off, br) {
  var lehmer = mallocArr(64, 0);
  var kSpan = 16;
  for (var i = 0; i < 64; i += kSpan) {
    br.FillBitBuffer();
    var has_non_zero = br.ReadBits(1);
    if (!has_non_zero) continue;
    var start = (i > 0) ? i : 1;
    var end = i + kSpan;
    for (var j = start; j < end; ++j) {
      var v = 0;
      while (v <= 64) {
        br.FillBitBuffer();
        var bits = br.ReadBits(3);
        v += bits;
        if (bits < 7) break;
      }
      if (v > 64) v = 64;
      lehmer[j] = v;
    }
  }
  var end = 63;
  while (end > 0 && lehmer[end] == 0) {
    --end;
  }
  for (var i = 1; i <= end; ++i) {
    --lehmer[i];
  }
  DecodeLehmerCode(lehmer, 64, order, order_off);
  for (var k = 0; k < 64; ++k) {
    order[order_off+k] = kNaturalCoeffOrder[order[order_off+k]];
  }
  return true;
}

function DecodeACData(data, data_off, len,
                    context_map,
                    decoder,
                    coeffs) {
  var dummy_buffer = mallocArr(4, 0);var dummy_buffer_off = 0;
  PIK_CHECK(len >= 4 || len == 0);
  var br=new BitReader(len == 0 ? dummy_buffer : data,len == 0 ? dummy_buffer_off : data_off, len);
  var coeff_order=mallocArr(192,0);
  for (var c = 0; c < 3; ++c) {
    DecodeCoeffOrder(coeff_order,c * 64, br);
  }
  for (var y = 0; y < coeffs.ysize(); ++y) {
    var row = coeffs.Row(y);var row_off = coeffs.Row_off(y);
    var prev_num_nzeros = mallocArr(3, 0);
    for (var x = 0; x < coeffs.xsize(); x += 64) {
      for (var c = 0; c < 3; ++c) {
        memset(row[c],row_off[c]+ x + 1, 0, 63);// * sizeof(row[0][0])
        br.FillBitBuffer();
        var context1 = c * 16 + (prev_num_nzeros[c] >> 2);
        var num_nzeros =
            kIndexLut[decoder.ReadSymbol(context_map[context1], br)];
        prev_num_nzeros[c] = num_nzeros;
        if (num_nzeros == 0) continue;
        var histo_offset = 48 + c * 120;
        var context2 = ZeroDensityContext(num_nzeros - 1, 0, 4);
        var histo_idx = context_map[histo_offset + context2];
        for (var k = 1; k < 64 && num_nzeros > 0; ++k) {
          br.FillBitBuffer();
          var s = decoder.ReadSymbol(histo_idx, br);
          k += (s >> 4);
          s &= 15;
          if (s > 0) {
            var bits = br.PeekBits(s);
            br.Advance(s);
            s = bits < (1 << (s - 1)) ? bits + (((~0) << s )>>>0) + 1 : bits;//U
			if(s > 0x7fffffff) s -=4294967296;
            var context = ZeroDensityContext(num_nzeros - 1, k, 4);
            histo_idx = context_map[histo_offset + context];
            --num_nzeros;
          }
		  if(false) {//s>255
		  for(var i=0;i<4;++i) {
          row[c][row_off[c]+x + coeff_order[c * 64 + k]+i] = s>>>(i*8)&255;
		  }
		  } else {
			  row[c][row_off[c]+x + coeff_order[c * 64 + k]] = s;
		  }
        }
        PIK_CHECK(num_nzeros == 0);
      }
    }
  }
  return br.Position();
}

function DecodeAC(data, data_off, len, coeffs) {
  var pos = 0;
  var context_map=new Array();
  var decoder=new ANSSymbolReader();
  pos += DecodeHistograms(data, data_off, len, (new ACBlockProcessor()).num_contexts(),
                          kSymbolLut, kSymbolLut.length,//sizeof(kSymbolLut)
                          decoder, context_map);
  pos += DecodeACData(data,data_off + pos, len - pos, context_map, decoder, coeffs);
  return pos;
}

function DecodeImage(data, data_off, len, stride,
                     coeffs) {
  var pos = 0;
  var context_map=new Array();
  var decoder=new ANSSymbolReader();
  pos += DecodeHistograms(data, data_off, len, (new CoeffProcessor()).num_contexts(), null, 0,
                          decoder, context_map);
  pos += DecodeImageData(data, data_off + pos, len - pos, context_map, stride,
                         decoder, coeffs);
  PIK_CHECK(decoder.CheckANSFinalState());
  return pos;
}

function DeltaCodingProcessor(minval, maxval, xsize) {
  this.Reset=function() {
    this.row_ = mallocArr(this.xsize_,0);
  }
	
  this.PredictVal=function(x, y, c) {
    if (x == 0) {
      return y == 0 ? (this.minval_ + this.maxval_ + 1) >> 1 : this.row_[x];
    }
    if (y == 0) {
      return this.row_[x - 1];
    }
    return (this.row_[x] + this.row_[x - 1] + 1) >> 1;
  }

  this.SetVal=function(x, y, c, val) {
    this.row_[x] = val;
  }

  this.minval_=(minval), this.maxval_=(maxval), this.xsize_=(xsize);
  this.Reset();
}

function DecodePlane(data, data_off, len, minval, maxval,
                     img) {
  var in_=new BitReader(data, data_off, len);
  var huff=new HuffmanDecodingData();
  huff.ReadFromBitStream(in_);
  var decoder=new HuffmanDecoder();
  var processor=new DeltaCodingProcessor(minval, maxval, img.xsize());
  for (var y = 0; y < img.ysize(); ++y) {
    var row = img.Row(y);var row_off = img.Row_off(y);
    for (var x = 0; x < img.xsize(); ++x) {
      var symbol = decoder.ReadSymbol(huff, in_);
      var diff = SignedIntFromSymbol(symbol);
      row[row_off+x] = diff + processor.PredictVal(x, y, 0);
      processor.SetVal(x, y, 0, row[row_off+x]);
    }
  }
  return in_.Position();
}

function AbsResidual(c, pred) {
	var result= mallocArr(8,0);
	for(var i=0;i<8;++i) result[i]=Math.abs(c[i]-pred[i]);
  return result;// V8x32I(_mm256_abs_epi32(c - pred));
}
function Costs16(costs) {
  // Saturate to 16-bit for minpos; due to 128-bit interleaving, only the lower
  // 64 bits of each half are valid.
  /*const V16x16U costs7654_3210(_mm256_packus_epi32(costs, costs));
  const V8x16U costs3210(_mm256_extracti128_si256(costs7654_3210, 0));
  const V8x16U costs7654(_mm256_extracti128_si256(costs7654_3210, 1));
  return V8x16U(_mm_unpacklo_epi64(costs3210, costs7654));*/
  return costs;
}
function Average(v0, v1) {
  return (v0 + v1) >> 1;
}
function minpos(a) {
  var index = 0;
  var min = a[0];
  for(var j = 0; j<=7;++j) {
    if(a[j] < min) {
      index = j;
      min = a[j]
    }
  }
  return min|index<<16;
}
function summe(a,b) {
	var result= mallocArr(8,0);
	for(var i=0;i<8;++i) result[i]=(a[i]+b[i]);
	
	  return result;
}

function permutevar8x32(a, idx) {
  var result= mallocArr(8,0);
  for(var i=0;i<8;++i) result[i]=(a[idx]);
  return result;
}

function Broadcast(v) {
	return mallocArr(8,v);
}
function ClampedGradient(n, w, l) {
  var grad = n + w - l;
  var min = Math.min(n, Math.min(w, l));
  var max = Math.max(n, Math.max(w, l));
  return Math.min(Math.max(min, grad), max);
}
function PixelNeighborsY(row_ym,row_ym_off,
                  row_yb,row_yb_off,
                  row_t,row_t_off,
                  row_m,row_m_off,
                  row_b,row_b_off) {
  var V = function(v=0) {return mallocArr(8,v)};
  /*this.tl_=new V();
  this.tn_=new V();
  this.n_=new V();
  this.w_=new V();
  this.l_=new V();*/
  // (30% overall speedup by reusing the current prediction as the next pred_w_)
  this.pred_w_=new V();

    var wl=new V(row_m[row_m_off+0]);
    var ww=new V(row_b[row_b_off+0]);
    this.tl_ = new V(row_t[row_t_off+1]);
    this.tn_ = new V(row_t[row_t_off+2]);
    this.l_ = new V(row_m[row_m_off+1]);
    this.n_ = new V(row_m[row_m_off+2]);
    this.w_ = new V(row_b[row_b_off+1]);
    this.pred_w_ = Predict(this.l_[0], ww[0], wl[0], this.n_[0]);	
  // Estimates "cost" for each predictor by comparing with known n and w.
  this.PredictorCosts=function(x,
                      row_ym,row_ym_off,
                      row_yb,row_yb_off,
                      row_t,row_t_off) {
    var tr=new V(row_t[row_t_off+ x + 1]);
    var costs =
        summe(AbsResidual(this.n_, Predict(this.tn_[0], this.l_[0], this.tl_[0], tr[0])), AbsResidual(this.w_, this.pred_w_));
    this.tl_ = this.tn_;
    this.tn_ = tr;
    return costs;
  }
  // Returns predictor for pixel c with min cost and updates pred_w_.
  this.PredictC=function(r, costs) {
    var idx_min=minpos(Costs16(costs));
    var index = (idx_min) >> 16;//V8x32U

    var pred_c = Predict(this.n_[0], this.w_[0], this.l_[0], r);//Broadcast()
    this.pred_w_ = pred_c;

    var best=pred_c[index];
    return best;
  }
  this.Advance=function(r, c) {
    this.l_ = this.n_;
    this.n_ = Broadcast(r);
    this.w_ = Broadcast(c);
  }

  function Predict(n, w, l, r) {
	  var pred=new V();
	  pred[0] = Average(w, n);
	  pred[1] = Average(Average(w, r), n);
	  pred[2] = Average(n, r);
	  pred[3] = Average(w, l);
	  pred[4] = Average(l, n);
	  pred[5] = w;
	  pred[6] = ClampedGradient(n, w, l);
	  pred[7] = n;
	  return pred;
 }
}
function PixelNeighborsUV(row_ym,row_ym_off,
                  row_yb,row_yb_off,
                  row_t,row_t_off,
                  row_m,row_m_off,
                  row_b,row_b_off) {

  var V = function(v=0) {return mallocArr(8,v)};

    this.yn_ = V(row_ym[row_ym_off+2]);
    this.yw_ = V(row_yb[row_yb_off+1]);
    this.yl_ = V(row_ym[row_ym_off+1]);
    this.n_ = [row_m[row_m_off+2 * 2],row_m[row_m_off+2 * 2+1]];
    this.w_ = [row_b[row_b_off+2 * 1],row_b[row_b_off+2 * 1+1]];
    this.l_ = [row_m[row_m_off+2 * 1],row_m[row_m_off+2 * 1+1]];
  // Estimates "cost" for each predictor by comparing with known c from Y band.
  this.PredictorCosts=function(x,
                               row_ym,row_ym_off,
                               row_yb,row_yb_off,
                               row_t,row_t_off) {
    var yr=new V(row_ym[row_ym_off+x + 1]);
    var yc=new V(row_yb[row_yb_off+x]);
    var costs = AbsResidual(yc, Predict(this.yn_[0], this.yw_[0], this.yl_[0], yr[0]));
    this.yl_ = this.yn_;
    this.yn_ = yr;
    this.yw_ = yc;
    return costs;
  }
  // Returns predictor for pixel c with min cost.
  this.PredictC=function(r, costs) {
    var idx_min=minpos(Costs16(costs));
    var index = (idx_min) >> 16;//V8x32U

    var predictors_u =
        Predict(this.n_[1], this.w_[1], this.l_[1], r[1]);
    var predictors_v =
        Predict(this.n_[0], this.w_[0], this.l_[0], r[0]);
    // permutevar is faster than Store + load_ss.
    var best_u=predictors_u[index];
    var best_v=predictors_v[index];
    return [best_v, best_u];
  }
  
  this.Advance=function(r, c) {
    this.l_ = this.n_;
    this.n_ = r;
    this.w_ = c;
  }

  function Predict(n, w, l, r) {
	  var pred=new V();
      pred[0] = ClampedGradient(n, w, l);
      pred[1] = n;
      pred[2] = Average(n, w);
      pred[3] = Average(Average(w, r), n);
      pred[4] = w;
      pred[5] = Average(n, r);
      pred[6] = Average(w, l);
      pred[7] = r;
	  return pred;
  }
}

function FixedWY(N) {
  this.Expand=function(xsize,
                       residuals,
                       dc) {
	dc[0]=residuals[0];
    //N::StoreT(N::LoadT(residuals, 0), dc, 0);
    for (var x = 1; x < xsize; ++x) {
      dc[x]=dc[x - 1]+residuals[x];
      //N::StoreT(N::LoadT(dc, x - 1) + N::LoadT(residuals, x), dc, x);
    }
  }
}
function FixedWUV(N) {
  this.Expand=function(xsize,
                       residuals,
                       dc) {
	dc[0]=residuals[0];
	dc[0+1]=residuals[0+1];
    //N::StoreT(N::LoadT(residuals, 0), dc, 0);
    for (var x = 1; x < xsize; ++x) {
      dc[2 * x]=dc[2 * (x - 1)]+residuals[2 * x];
      dc[2 * x+1]=dc[2 * (x - 1)+1]+residuals[2 * x+1];
      //N::StoreT(N::LoadT(dc, x - 1) + N::LoadT(residuals, x), dc, x);
    }
  }
}

function LeftBorder2Y() {
  this.Expand=function(xsize,
              residuals, residuals_off,
              row_m, row_m_off,
              row_b, row_b_off) {
    row_b[row_b_off+0]=row_m[row_m_off+0]+residuals[residuals_off+0];
    //N::StoreT(N::LoadT(row_m, 0) + N::LoadT(residuals, 0), row_b, 0);
    if (xsize >= 2) {
		row_b[row_b_off+1]=row_b[row_b_off+0]+residuals[residuals_off+1];
      //N::StoreT(N::LoadT(row_b, 0) + N::LoadT(residuals, 1), row_b, 1);
    }
  }
}
function LeftBorder2UV() {
  this.Expand=function(xsize,
              residuals, residuals_off,
              row_m, row_m_off,
              row_b, row_b_off) {
    row_b[row_b_off+0]=row_m[row_m_off+0]+residuals[residuals_off+0];
    row_b[row_b_off+1]=row_m[row_m_off+1]+residuals[residuals_off+1];
    //N::StoreT(N::LoadT(row_m, 0) + N::LoadT(residuals, 0), row_b, 0);
    if (xsize >= 2) {
		row_b[row_b_off+2*1+0]=row_b[row_b_off+0]+residuals[residuals_off+2*1+0];
		row_b[row_b_off+2*1+1]=row_b[row_b_off+1]+residuals[residuals_off+2*1+1];
      //N::StoreT(N::LoadT(row_b, 0) + N::LoadT(residuals, 1), row_b, 1);
    }
  }
}

function RightBorder1Y() {
  this.Expand=function(xsize,
                       residuals,residuals_off,
                       dc,dc_off) {
    if (xsize >= 2) {
      var uv = dc[dc_off+xsize - 2]+residuals[residuals_off+xsize - 1];
	  //N::LoadT(dc, xsize - 2) + N::LoadT(residuals, xsize - 1);
	  dc[dc_off+xsize - 1]=uv;
      //N::StoreT(uv, dc, xsize - 1);
    }
  }
}
function RightBorder1UV() {
  this.Expand=function(xsize,
                       residuals,residuals_off,
                       dc,dc_off) {
    if (xsize >= 2) {
      var uv  = dc[dc_off+2*(xsize - 2)]+residuals[residuals_off+2*(xsize - 1)];
      var uv2 = dc[dc_off+2*(xsize - 2)+1]+residuals[residuals_off+2*(xsize - 1)+1];
	  //N::LoadT(dc, xsize - 2) + N::LoadT(residuals, xsize - 1);
	  dc[dc_off+2*(xsize - 1)]=uv;
	  dc[dc_off+2*(xsize - 1)+1]=uv2;
      //N::StoreT(uv, dc, xsize - 1);
    }
  }
}

function AdaptiveY(N) {
  this.Expand=function(xsize, row_ym, row_ym_off,
                     row_yb, row_yb_off,
                     residuals, residuals_off,
                     row_t, row_t_off,
                     row_m, row_m_off,
                     row_b, row_b_off) {
    (new LeftBorder2Y()).Expand(xsize, residuals, residuals_off, row_m, row_m_off, row_b, row_b_off);

  var ForeachPrediction=function(xsize,
                                  row_ym,row_ym_off,
                                  row_yb,row_yb_off,
                                  row_t,row_t_off,
                                  row_m,row_m_off,
                                  row_b,row_b_off,
                                  func) {//if(typeof xsize!=='undefined') return;
    if (xsize < 2) {
      return;  // Avoid out of bounds reads.
    }
    var neighbors=new N(row_ym, row_ym_off, row_yb, row_yb_off, row_t, row_t_off, row_m, row_m_off, row_b, row_b_off);
    // PixelNeighborsY uses w at x - 1 => two pixel margin.
    for (var x = 2; x < xsize - 1; ++x) {
      var r = row_m[row_m_off+ x + 1];
      var costs = neighbors.PredictorCosts(x, row_ym, row_ym_off, row_yb, row_yb_off, row_t, row_t_off, row_t, row_t_off);//V8x32I
      var pred_c = neighbors.PredictC(r, costs);//T
      var c = func(x, pred_c);//T
      neighbors.Advance(r, c);
    }
  }
    ForeachPrediction(xsize, row_ym, row_ym_off, row_yb, row_yb_off, row_t, row_t_off, row_m, row_m_off, row_b, row_b_off,
                      function(x, pred) {
						  var c = pred + residuals[residuals_off+x];
                        //const T c = pred + N::LoadT(residuals, x);
						row_b[row_b_off+x]=c;
                        //N::StoreT(c, row_b, x);
                        return c;
                      });//(row_b, residuals)

    (new RightBorder1Y()).Expand(xsize, residuals, residuals_off, row_b, row_b_off);
  }

}

function AdaptiveUV(N) {
  this.Expand=function(xsize, row_ym, row_ym_off,
                     row_yb, row_yb_off,
                     residuals, residuals_off,
                     row_t, row_t_off,
                     row_m, row_m_off,
                     row_b, row_b_off) {
    (new LeftBorder2UV()).Expand(xsize, residuals, residuals_off, row_m, row_m_off, row_b, row_b_off);

  var ForeachPrediction=function(xsize,
                                  row_ym,row_ym_off,
                                  row_yb,row_yb_off,
                                  row_t,row_t_off,
                                  row_m,row_m_off,
                                  row_b,row_b_off,
                                  func) {//if(typeof xsize!=='undefined') return;
    if (xsize < 2) {
      return;  // Avoid out of bounds reads.
    }
    var neighbors=new N(row_ym, row_ym_off, row_yb, row_yb_off, row_t, row_t_off, row_m, row_m_off, row_b, row_b_off);
    // PixelNeighborsY uses w at x - 1 => two pixel margin.
    for (var x = 2; x < xsize - 1; ++x) {
      var r = [row_m[row_m_off+ 2*(x + 1)],row_m[row_m_off+ 2*(x + 1)+1]];
      var costs = neighbors.PredictorCosts(x, row_ym, row_ym_off, row_yb, row_yb_off, row_t, row_t_off, row_t, row_t_off);//V8x32I
      var pred_c = neighbors.PredictC(r, costs);//T
      var c = func(x, pred_c);//T
      neighbors.Advance(r, c);
    }
  }
    ForeachPrediction(xsize, row_ym, row_ym_off, row_yb, row_yb_off, row_t, row_t_off, row_m, row_m_off, row_b, row_b_off,
                      function(x, pred) {
						  var c =  pred[0] + residuals[residuals_off+2*x];
						  var c2 = pred[1] + residuals[residuals_off+2*x+1];
                        //const T c = pred + N::LoadT(residuals, x);
						row_b[row_b_off+2*x]=c;
						row_b[row_b_off+2*x+1]=c2;
                        //N::StoreT(c, row_b, x);
                        return [c,c2];
                      });//(row_b, residuals)

    (new RightBorder1UV()).Expand(xsize, residuals, residuals_off, row_b, row_b_off);
  }

}

function ExpandY(residuals, dc) {
  var xsize = dc.xsize();
  var ysize = dc.ysize();

  (new FixedWY(PixelNeighborsY)).Expand(xsize, residuals.Row(0), dc.Row(0));//<PixelNeighborsY>::

  if (ysize >= 2) {
    (new AdaptiveY(PixelNeighborsY)).Expand(xsize, null, null, null, null, residuals.Row(1), residuals.Row_off(1),
                                      dc.Row(0), dc.Row_off(0), dc.Row(0), dc.Row_off(0), dc.Row(1), dc.Row_off(1));
  }

  for (var y = 2; y < ysize; ++y) {
    (new AdaptiveY(PixelNeighborsY)).Expand(xsize, null, null, null, null, residuals.Row(y), residuals.Row_off(y),
                                      dc.Row(y - 2), dc.Row_off(y - 2), dc.Row(y - 1), dc.Row_off(y - 1),
                                      dc.Row(y), dc.Row_off(y));
  }
}
function ExpandUV(dc_y, residuals,
              dc) {
  var xsize = dc.xsize() / 2;
  var ysize = dc.ysize();

  (new FixedWUV(PixelNeighborsUV)).Expand(xsize, residuals.Row(0), dc.Row(0));

  if (ysize >= 2) {
    (new AdaptiveUV(PixelNeighborsUV)).Expand(xsize, dc_y.Row(0), dc_y.Row_off(0), dc_y.Row(1), dc_y.Row_off(1),
                                       residuals.Row(1), residuals.Row_off(1), dc.Row(0), dc.Row_off(0), dc.Row(0), dc.Row_off(0),
                                       dc.Row(1), dc.Row_off(1));
  }

  for (var y = 2; y < ysize; ++y) {
    (new AdaptiveUV(PixelNeighborsUV)).Expand(xsize, dc_y.Row(y - 1), dc_y.Row_off(y - 1), dc_y.Row(y), dc_y.Row_off(y),
                                       residuals.Row(y), residuals.Row_off(y), dc.Row(y - 2), dc.Row_off(y - 2),
                                       dc.Row(y - 1), dc.Row_off(y - 1), dc.Row(y), dc.Row_off(y));
  }
}


/*function ExpandY(residuals, dc) {
  (new PIK_TARGET_NAME()).ExpandY(residuals, dc);
}*/

function PIK_ASSERT(condition) {
	//assert(condition);
}

function PIK_CHECK(condition) {
	assert(condition);
}var kYToBRes = 48;
CompressedImage.prototype = function() {
  this.xsize_;
  this.ysize_;
  this.block_xsize_;
  this.block_ysize_;
  this.quant_xsize_;
  this.quant_ysize_;
  this.num_blocks_;
  this.quantizer_=new Quantizer();
  this.dct_coeffs_=new Image3W();
  // The opsin dynamics image as seen by the decoder, kept for prediction
  // context.
  this.opsin_recon_=new Image3F();
  this.srgb_=new Image3B();
  // Transformed version of the original image, only present if the image
  // was constructed with FromOpsinImage().
  this.opsin_image_=new Image3F();
  this.ytob_dc_;
  this.ytob_ac_=new Image_();
  // Not owned, used to report additional statistics to the callers of
  // PixelsToPik() and PikToPixels().
  this.pik_info_=new PikInfo();
}

  CompressedImage.prototype.MoveSRGB=function() {
    this.srgb_.ShrinkTo(this.xsize_, this.ysize_);
    return this.srgb_;//std::move()
  }

  var lut_plus = OpsinToSrgb8TablePlusQuarter();
  var lut_minus = OpsinToSrgb8TableMinusQuarter();


  CompressedImage.prototype.YToBDC=function() { return this.ytob_dc_ / 128.0; }
  CompressedImage.prototype.YToBAC=function(tx, ty) { return this.ytob_ac_.Row(ty)[this.ytob_ac_.Row_off(ty)+ tx] / 128.0; }

// If true, does the prediction on the pixels of the opsin dynamics image and
// performs the integral transform on the prediction residuals.
var FLAGS_predict_pixels = false;

var kBlockEdge = 8;
var kBlockSize = kBlockEdge * kBlockEdge;
var kBlockSize2 = 2 * kBlockSize;
var kBlockSize3 = 3 * kBlockSize;
var kLastCol = kBlockEdge - 1;
var kLastRow = kLastCol * kBlockEdge;
var kCoeffsPerBlock = kBlockSize;
var kQuantBlockRes = 1;

function DivCeil(a, b) {
  return Math.trunc((a + b - 1) / b);
}

var kQuantizeMul = new Array( 2.631, 0.780, 0.125 );

// kQuantWeights[3 * k_zz + c] is the relative weight of the k_zz coefficient
// (in the zig-zag order) in component c. Higher weights correspond to finer
// quantization intervals and more bits spent in encoding.
var kQuantWeights = new Array(
  3.0406127, 1.9428079, 3.7470236, 2.1412505, 1.5562126, 2.0441338,
  2.0713710, 1.6664879, 2.0016495, 1.4308078, 1.5208181, 1.2703535,
  1.6697885, 1.6883024, 1.4859944, 1.3013033, 1.5966423, 1.2529299,
  1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000,
  1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000, 1.0000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000, 0.8000000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000, 0.6200000,
  0.6200000, 0.6200000, 0.6200000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000,
  0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000, 0.6000000
);

function getmodifier(i) {return 0.0;
  /*char buf[10];
  snprintf(buf, 10, "VAR%d", i);
  char* p = getenv(buf);
  if (p == nullptr) return 0.0;
  return static_cast<float>(atof(p));*/
}

function NewDequantMatrix() {
  var table = mallocArr(3 * kCoeffsPerBlock * 1,0);
      //CacheAligned::Allocate( sizeof(float)));
  for (var c = 0; c < 3; ++c) {
    for (var k_zz = 0; k_zz < kBlockSize; ++k_zz) {
      var k = kNaturalCoeffOrder[k_zz];
      var idx = k_zz * 3 + c;
      var idct_scale =
          kIDCTScales[k % kBlockEdge] * kIDCTScales[(k / kBlockEdge)|0] / 64.0;
      var weight = kQuantWeights[idx];
      var modify = getmodifier(idx);
      PIK_CHECK(modify > -0.5 * weight);
      weight += modify;
      weight *= kQuantizeMul[c];
      table[c * kCoeffsPerBlock + k] = idct_scale / weight;
    }
  }
  return table;
}

function DequantMatrix() {
  var kDequantMatrix = NewDequantMatrix();
  return kDequantMatrix;
}

// static
function CompressedImage() {
  this.xsize_;
  this.ysize_;
  this.block_xsize_;
  this.block_ysize_;
  this.quant_xsize_;
  this.quant_ysize_;
  this.num_blocks_;
  this.quantizer_=new Quantizer();
  this.dct_coeffs_=new Image3W();
  // The opsin dynamics image as seen by the decoder, kept for prediction
  // context.
  this.opsin_recon_=new Image3F();
  this.srgb_=new Image3B();
  // Transformed version of the original image, only present if the image
  // was constructed with FromOpsinImage().
  this.opsin_image_=new Image3F();
  this.ytob_dc_;
  this.ytob_ac_=new Image_();
  // Not owned, used to report additional statistics to the callers of
  // PixelsToPik() and PikToPixels().
  this.pik_info_=new PikInfo();//*
  this._3=function(xsize, ysize, info) {
      this.xsize_=(xsize), this.ysize_=(ysize),
      this.block_xsize_=(DivCeil(xsize, kBlockEdge)),
      this.block_ysize_=(DivCeil(ysize, kBlockEdge)),
      this.quant_xsize_=(DivCeil(this.block_xsize_, kQuantBlockRes)),
      this.quant_ysize_=(DivCeil(this.block_ysize_, kQuantBlockRes)),
      this.num_blocks_=(this.block_xsize_ * this.block_ysize_),
      this.quantizer_=new Quantizer(),this.quantizer_._(this.quant_xsize_, this.quant_ysize_, kCoeffsPerBlock, DequantMatrix()),
      this.dct_coeffs_=new Image3W(),this.dct_coeffs_._2(this.block_xsize_ * kBlockSize, this.block_ysize_),
      this.opsin_recon_=new Image3F(),this.opsin_recon_._2(this.block_xsize_ * kBlockSize, this.block_ysize_),
      this.srgb_=new Image3B(),this.srgb_._2(this.block_xsize_ * kBlockEdge, this.block_ysize_ * kBlockEdge),
      this.ytob_dc_=(120),
      this.ytob_ac_=new Image_(),this.ytob_ac_._3(DivCeil(xsize, kYToBRes), DivCeil(ysize, kYToBRes), 120),
      this.pik_info_=(info);//Todo: Maybe copy?
  }
this.DecodeQuantization=function(data, data_off, len) {
  return this.quantizer_.Decode(data, data_off, len);
}

this.Decode=function(xsize, ysize,
                       data,
                       info) {
  var img=new CompressedImage();img._3(xsize, ysize, info);
  var input = data;
  var len = data.length;

  var pos = 0;
  img.ytob_dc_ = input[pos++];
  pos += DecodePlane(input, + pos, len - pos, 0, 255, img.ytob_ac_);//&
  pos += img.DecodeQuantization(input, + pos, len - pos);
  pos += DecodeImage(input, + pos, len - pos, kBlockSize, img.dct_coeffs_);//&
  pos += DecodeAC(input, + pos, len - pos, img.dct_coeffs_);//&
  PIK_CHECK(pos == len);
  if (!FLAGS_predict_pixels) {
    UnpredictDC(img.dct_coeffs_);//&
  }
  var block=new Array();block.length=kBlockSize3;//alignas(32) float
  for (var block_y = 0; block_y < img.block_ysize_; ++block_y) {
    for (var block_x = 0; block_x < img.block_xsize_; ++block_x) {
      img.UpdateBlock(block_x, block_y, block);
      img.UpdateSRGB(block, block_x, block_y);
    }
  }
  return img;
  }

this.UpdateBlock=function(block_x, block_y,
                          block) {
  //using namespace PIK_TARGET_NAME;
  var quant_y = (block_y / kQuantBlockRes)|0;
  var tile_y = (block_y * kBlockEdge / kYToBRes)|0;
  var row = this.dct_coeffs_.Row(block_y);var row_off = this.dct_coeffs_.Row_off(block_y);
  var quant_x = (block_x / kQuantBlockRes)|0;
  var tile_x = (block_x * kBlockEdge / kYToBRes)|0;
  var offset = block_x * kBlockSize;
  var inv_quant_dc = this.quantizer_.inv_quant_dc();
  var inv_quant_ac = this.quantizer_.inv_quant_ac(quant_x, quant_y);
  var kDequantMatrix = DequantMatrix();
  for (var c = 0; c < 3; ++c) {
    var iblock = row[c];var iblock_off = row_off[c]+ offset;
    var muls = kDequantMatrix;var muls_off = c * kBlockSize;
    var cur_block = block;var cur_block_off = c * kBlockSize;
    for (var k = 0; k < kBlockSize; ++k) {
      cur_block[cur_block_off+k] = iblock[iblock_off+k] * (muls[muls_off+k] * inv_quant_ac);
    }
    cur_block[cur_block_off+0] = iblock[iblock_off+0] * (muls[muls_off+0] * inv_quant_dc);
  }
  //using V = V8x32F;
  var kYToBAC = this.YToBAC(tile_x, tile_y);
  for (var k = 0; k < kBlockSize; k += 1) {//V::N
    var y = block[+ k + kBlockSize];
    var b = block[+ k + kBlockSize2] + kYToBAC * y;
    block[+ k + kBlockSize2]=b;
  }
  block[kBlockSize2] += (this.YToBDC() - kYToBAC) * block[kBlockSize];
  for (var c = 0; c < 3; ++c) {
    ComputeTransposedScaledBlockIDCTFloat(block,kBlockSize * c);
  }
  /*if (FLAGS_predict_pixels) {
    for (var c = 0; c < 3; ++c) {
      if (block_x > 0 && block_y > 0) {
        var prediction=mallocArr(kBlockSize,0);
        PredictBlock(this.opsin_recon_.Row(block_y)[c][this.opsin_recon_.Row_off(block_y)+ offset - kBlockSize],
                     this.opsin_recon_.Row(block_y - 1)[c][this.opsin_recon_.Row_off(block_y - 1)+ offset],
                     prediction);
        AddBlock(prediction, block,kBlockSize * c);
      }
      memcpy(this.opsin_recon_.Row(block_y)[c][opsin_recon_.Row_off(block_y)+ offset],0, block,c * kBlockSize,
             kBlockSize);// * sizeof(block[0])
    }
  }*/
function RoundToInt(v) {
	return Math.round(v);
}
this.UpdateSRGB=function(block,
                         block_x, block_y) {
  //using namespace PIK_TARGET_NAME;
  // TODO(user) Combine these two for loops and get rid of rgb[].
  var rgb=mallocArr(kBlockSize3,0);
  for (var k = 0; k < kBlockSize; k += 1) {//V::N
    var x = block[+ k] + kXybCenter[0];
    var y = block[+ k + kBlockSize] + kXybCenter[1];
    var b = block[+ k + kBlockSize2] + kXybCenter[2];
    var lut_scale = 16.0;
    var out_r=[0], out_g=[0], out_b=[0];
    XybToRgb(x, y, b, out_r, out_g, out_b);
    rgb[+ k] = RoundToInt(out_r[0] * lut_scale);
    rgb[+ k + kBlockSize] = RoundToInt(out_g[0] * lut_scale);
    rgb[+ k + kBlockSize2] = RoundToInt(out_b[0] * lut_scale);
  }
  var yoff = kBlockEdge * block_y;
  var xoff = kBlockEdge * block_x;
  for (var iy = 0; iy < kBlockEdge; ++iy) {
    var row = this.srgb_.Row(iy + yoff);var row_off = this.srgb_.Row_off(iy + yoff);
    for (var ix = 0; ix < kBlockEdge; ++ix) {
      var px = ix + xoff;
      var k = kBlockEdge * iy + ix;
      var lut = (ix + iy) % 2 ? lut_plus : lut_minus;
      row[0][row_off[0]+ px] = lut[rgb[k + 0]];
      row[1][row_off[1]+ px] = lut[rgb[k + kBlockSize]];
      row[2][row_off[2]+ px] = lut[rgb[k + kBlockSize2]];
    }
  }
}

}

}function PikToPixels(params, compressed,
                 planes, aux_out) {
  if (compressed.length==0) {
    return PIK_FAILURE("Empty input.");
  }
  var header=new Header();
  var padded=new Bytes();padded.length=Math.max(MaxCompressedHeaderSize(), compressed.length);
  memcpy(padded,0, compressed,0, compressed.length);
  var source=new BitSource(padded);
  if (!LoadHeader(source, header)) return false;
  var end = source.Finalize();
  if (header.flags & (new Header()).kWebPLossless) {
    return PIK_FAILURE("Invalid format code");
  } else {  // Pik
    var encoded_img=new Array();
    encoded_img=padded.slice(end,end+compressed.length);
    {
      var img = (new CompressedImage()).Decode(
          header.xsize[0], header.ysize[0], encoded_img, aux_out);
      planes[0] = img.MoveSRGB();
    }
  }
  return true;
}

this['Decompress']=function(input) {
  var compressed=new Bytes();
  var failed = false;

  /*if (!LoadFile(input, &compressed)) {
    return 1;
  }*/
  compressed=input;

  var params=new DecompressParams();
  var planes=[];// new Image3B();
  var info=new PikInfo();
  if (!PikToPixels(params, compressed, planes, info)) {
    console.log("Failed to decompress.\n");
    return 1;
  }
  
  var output = new Array();
  
  var width = planes[0].xsize();
  var height = planes[0].ysize();
  var stride = width*4;
  for(var y=0;y<height;++y) {
	  var row = planes[0].Row(y);var row_off = planes[0].Row_off(y);
	  for(var x=0;x<width;++x) {		  
        output[stride * y + 4 * x + 0] = row[0][row_off[0]+ x];
        output[stride * y + 4 * x + 1] = row[1][row_off[1]+x];
        output[stride * y + 4 * x + 2] = row[2][row_off[2]+x];
        output[stride * y + 4 * x + 3] = 255;
	  }
  }
  var data={'rgba':output,'width':width,'height':height};
  //printf("Decompressed %zu x %zu pixels.\n", planes.xsize(), planes.ysize());

  /*if (ImageFormatPNM::IsExtension(pathname_out)) {
	  failed = WriteImage(ImageFormatPNM(), planes, pathname_out);
  } else
  if (ImageFormatPNG::IsExtension(pathname_out)) {
	  failed = WriteImage(ImageFormatPNG(), planes, pathname_out);
  } else
  if (ImageFormatY4M::IsExtension(pathname_out)) {
	  failed = WriteImage(ImageFormatY4M(), planes, pathname_out);
  } else
  if (ImageFormatJPG::IsExtension(pathname_out)) {
	  failed = WriteImage(ImageFormatJPG(), planes, pathname_out);
  } else
  if (ImageFormatPlanes::IsExtension(pathname_out)) {
	  failed = WriteImage(ImageFormatPlanes(), planes, pathname_out);
  }

  if (!failed) {
    fprintf(stderr, "Failed to write %s.\n", pathname_out);
    return 1;
  }*/
  return data;
}

};
var pikdecoder=new window['PIKdecoder']();