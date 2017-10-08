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
var ANS_LOG_TAB_SIZE = 10;
var ANS_TAB_SIZE = (1 << ANS_LOG_TAB_SIZE);
var ANS_TAB_MASK = (ANS_TAB_SIZE - 1);
var ANS_SIGNATURE = 0x13;    // Initial state, used as CRC.

