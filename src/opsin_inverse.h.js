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

