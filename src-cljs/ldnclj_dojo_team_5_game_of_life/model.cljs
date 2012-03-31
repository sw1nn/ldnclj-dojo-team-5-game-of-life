(ns ldnclj-dojo-team-5-game-of-life.model ^{:doc "Holds the 'model' i.e. state of the grid and logic to move the grid to it's next state."}
  (:require [goog.Timer :as Timer]
            [goog.events :as events]
            [ldnclj-dojo-team-5-game-of-life.log :as log]))

(def ^:static WIDTH 20)
(def ^:static HEIGHT 20)
(def ^{:static true :private true} INDICES  (partition WIDTH (range (* WIDTH HEIGHT))))

(def *print-fn* log/info)

(defn- fill-random
  "Generate some random data to seed the "
  []
  (vec (map (fn [_] (if (< 0.6 (rand 1)) :alive)) (range (* WIDTH HEIGHT)))))

(def ^{:private true} *grid* (atom []))

(def timer (atom nil))

(defn- adjacent-indices-internal [i]
  (let [x        (mod i HEIGHT)
        y        (Math/floor (/ i HEIGHT))
        n        (dec y)                ; #rows to drop from north
        e        (- HEIGHT x 2)         ; #cols to drop from east
        s        (- WIDTH y 2)          ; #rows to drop from south
        w        (dec x)]               ; #cols to drop from west
    
    (vec (remove #(= % i)                    ; remove supplied index
                 (mapcat #(->> % (drop w) (drop-last e))
                         (->> INDICES (drop n) (drop-last s)))))))

(def adjacent-indices
  (memoize adjacent-indices-internal))

(defn adjacent-indices1 [i]
    (filter #(>= % 0) 
       ((juxt #(- % (inc WIDTH))    ; north-west  
              #(- % WIDTH)          ; north
              #(- % (dec WIDTH))    ; north-east
              dec                   ; west
              inc                   ; east
              #(+ % (dec WIDTH))    ; south-west
              #(+ % WIDTH)          ; south
              #(+ % (inc WIDTH)))   ; south-east
         i)))

(defn adjacent-indices2 [i]
    (let [x        (mod i HEIGHT)
          y        (Math/floor (/ i HEIGHT))
          n        (dec y)                ; #rows to drop from north
          e        (- HEIGHT x 2)         ; #cols to drop from east
          s        (- WIDTH y 2)          ; #rows to drop from south
          w        (dec x)]               ; #cols to drop from west
      (remove #(= % i)
              (->> INDICES
                   (drop n)
                   (drop-last s)
                   (apply map vector) ; transpose 
                   (drop w)
                   (drop e)
                   (apply concat)))))
    
(defn- next-gen-state
  "Main logic routine. Applies the rules of Conway's game of life.

   1. Any live cell with fewer than two live neighbours dies, as if caused by under-population.
   2. Any live cell with two or three live neighbours lives on to the next generation.
   3. Any live cell with more than three live neighbours dies, as if by overcrowding.
   4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
cl
  See http://en.wikipedia.org/wiki/Conway's_Game_of_Life for full details "
  [grid index alive?]
  (let [vals-at-indices (map grid (adjacent-indices index))
        n (count (remove nil? vals-at-indices))]
    (cond
      (or (> n 3) (< n 2)) nil
      (= n 3) :alive
      (and (= n 2) alive?) :alive
      :else nil)))


(defn- update-model
  "Applies the main logic of next-gen-state to each cell in the grid"
  []
  (log/info "update-model")

  (time
   (swap! *grid* #(vec (map-indexed (partial next-gen-state  %) %))))

  (log/debug "update-model-end"))

(defn add-listener
  "Allows interested view to register interest in model changes. TODO: only supports a single listener, should maintain a list."
  [f]
  (add-watch *grid* nil
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
  (swap! *grid* (fn [_] (fill-random)))
  (for [n (range (* WIDTH HEIGHT))] (adjacent-indices n))
  (log/info "toggle-run!")
  (start-timer))