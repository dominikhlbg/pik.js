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
this.Decompress=function(input) {
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

