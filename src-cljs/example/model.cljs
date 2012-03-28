(ns example.model ^{:doc "Holds the 'model' i.e. state of the grid and logic to move the grid to it's next state."}
  (:require [goog.Timer :as Timer]
            [goog.events :as events]
            [example.log :as log]))

(def ^:static WIDTH 100)
(def ^:static HEIGHT 50)
(def ^:static SIZE (* WIDTH HEIGHT))

(defn- fill-random
  "Generate some random data to seed the "
  []
  (vec (map (fn [_] (if (< 0.6 (rand 1)) :live :dead)) (range SIZE))))

(def ^{:private true} grid (atom (fill-random)))

(defn- living? [x] (= x :live))
(defn- alive-now? [x] (living? (grid-now x)))

(def timer (atom nil))


(defn- adjacent-indices
  "Resolves adjacent squares to the given index. NOTE This wraps horizontally but not vertically, you might consider that a bug..."
  [index]
  (filter #(< -1 % SIZE) ((juxt #(- % 1)
                                #(+ % 1)
                                #(- % WIDTH)
                                #(+ % WIDTH)
                                #(- % (inc WIDTH))
                                #(+ % (inc WIDTH))
                                #(- % (dec WIDTH))
                                #(+ % (dec WIDTH))) index)))

(defn- alive-next-time?
  "Core logic routine. Applies the rules of Conway's game of life.

   1. Any live cell with fewer than two live neighbours dies, as if caused by under-population.
   2. Any live cell with two or three live neighbours lives on to the next generation.
   3. Any live cell with more than three live neighbours dies, as if by overcrowding.
   4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

  See http://en.wikipedia.org/wiki/Conway's_Game_of_Life for full details "
  [index val]
  (let [vals-at-indices (map grid-now (adjacent-indices index))
        nlive (count (filter living? vals-at-indices))]
    (cond
     (or (> nlive 3) (< nlive 2)) :dead
     (= nlive 3) :live
     (and (= nlive 2) (alive-now? index)) :live
     :else
     :dead)))



(def ^{:doc "TODO: better way to handle passing the complete grid into alive-next-time?. This has a global smell to it..."} grid-now)

(defn- update-model
  "Applies the core logic of alive-next-time? to each cell in the grid"
  []
  (log/info "update-model")
  
  (binding [grid-now @grid]
    (swap! grid #(vec (map-indexed alive-next-time? %))))
  (log/debug "update-model-end"))

(defn add-listener
  "Allows interested view to register interest in model changes. TODO: only supports a single listener, should maintain a list."
  [f]
  (add-watch grid nil
             (fn [k r o n]
               (f n))))

(defn start-timer []
  (let [timer (goog.Timer. 1000)]
    (update-model)
    (. timer (start))
    (events/listen timer goog.Timer/TICK update-model)))

(defn toggle-run
  "Start the timer. TODO: Expose this up to UI and make it a genuine toggle to start/stop reproduction."
  []
  (log/info "toggle-run!")
  (start-timer))