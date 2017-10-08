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
function Load(block, block_off) {
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

