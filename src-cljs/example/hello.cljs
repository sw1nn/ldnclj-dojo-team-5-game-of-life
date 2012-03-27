(ns example.hello
  (:use [goog.dom :only [getElement]]))

(def *grid* atom)

;(def timer (goog.Timer. (/ 1000 60)))

(defn by-id [id]
  (.getElement goog.dom id))


(defn set-cell-state [x y state]
  (.setAttribute (by-id (str x "-" y)) "class" state))

(defn start []
  (set! *grid* (map  #(if (< 0.3 (rand 1)) "live" "dead") (range 100)))
  (update-grid))

(defn update-grid []
  (doall (map-indexed #(let [x (mod % 10) y (Math/floor (/ % 10))]
                         (set-cell-state x y %2)) *grid*)))


(set! (.-onload js/window) start)  

(setTimeout start 500 )
