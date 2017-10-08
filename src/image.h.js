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
