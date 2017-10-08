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
var kANSBufferSize = 1 << 16;

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

