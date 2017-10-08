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

