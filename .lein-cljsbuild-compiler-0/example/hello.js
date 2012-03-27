goog.provide('example.hello');
goog.require('cljs.core');
goog.require('goog.dom');
example.hello._STAR_grid_STAR_ = cljs.core.atom;
example.hello.by_id = (function by_id(id){
return goog.dom.getElement(id);
});
example.hello.set_cell_state = (function set_cell_state(x,y,state){
return example.hello.by_id.call(null,cljs.core.str.call(null,x,"-",y)).setAttribute("class",state);
});
example.hello.start = (function start(){
example.hello._STAR_grid_STAR_ = cljs.core.map.call(null,(function (){
if(cljs.core.truth_((0.3 < cljs.core.rand.call(null,1))))
{return "live";
} else
{return "dead";
}
}),cljs.core.range.call(null,100));
return example.hello.update_grid.call(null);
});
example.hello.update_grid = (function update_grid(){
return cljs.core.doall.call(null,cljs.core.map_indexed.call(null,(function (p1__33736_SHARP_,p2__33737_SHARP_){
var x__33738 = (p1__33736_SHARP_ % 10);
var y__33739 = Math.floor.call(null,(p1__33736_SHARP_ / 10));

return example.hello.set_cell_state.call(null,x__33738,y__33739,p2__33737_SHARP_);
}),example.hello._STAR_grid_STAR_));
});
window.onload = example.hello.start;
example.hello.setTimeout.call(null,example.hello.start,500);
