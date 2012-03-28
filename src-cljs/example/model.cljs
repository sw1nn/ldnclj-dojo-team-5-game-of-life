(ns example.model
  (:require [goog.Timer :as Timer]
            [goog.events :as events]
            [example.log :as log]))

(def ^:static WIDTH 100)
(def ^:static HEIGHT 50)
(def ^:static SIZE (* WIDTH HEIGHT))

(defn- fill-random []
  (vec (map (fn [_] (if (< 0.6 (rand 1)) :live :dead)) (range SIZE))))

(def ^{:private true} grid (atom (fill-random)))

(defn- living? [x] (= x :live))
(defn- alive-now? [x] (living? (grid-now x)))

(def timer (atom nil))


(defn- adjacent-indices [index]
  (filter #(< -1 % SIZE) ((juxt #(- % 1)
                                #(+ % 1)
                                #(- % WIDTH)
                                #(+ % WIDTH)
                                #(- % (inc WIDTH))
                                #(+ % (inc WIDTH))
                                #(- % (dec WIDTH))
                                #(+ % (dec WIDTH))) index)))

(defn- alive-next-time? [index val]
  (let [vals-at-indices (map grid-now (adjacent-indices index))
        nlive (count (filter living? vals-at-indices))]
    (cond
     (or (> nlive 3) (< nlive 2)) :dead
     (= nlive 3) :live
     (and (= nlive 2) (alive-now? index)) :live
     :else
     :dead)))

(def grid-now)

(defn- update-model []
  (log/info "update-model")
  
  (binding [grid-now @grid]
    (swap! grid #(vec (map-indexed alive-next-time? %))))
  (log/debug "update-model-end"))

(defn add-listener [f]
  (add-watch grid nil
             (fn [k r o n]
               (f n))))

(defn start-timer []
  (let [timer (goog.Timer. 1000)]
    (update-model)
    (. timer (start))
    (events/listen timer goog.Timer/TICK update-model)))

(defn toggle-run []
  (log/info "toggle-run!")
  (start-timer))
