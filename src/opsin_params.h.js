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
