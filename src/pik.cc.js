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
function PikToPixels(params, compressed,
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

