(ns example.model
  (:require [goog.Timer :as Timer]
            [goog.events :as events]
            [example.log :as log]))

(def ^:static WIDTH 100)
(def ^:static HEIGHT 50)

(defn- init-random []
  (map #(if (< 0.2 (rand 1)) :live :dead) (range (* WIDTH HEIGHT))))

(def ^{:private true} grid (atom (init-random)))

(def ^{:private true} timer (goog.Timer. (/ 1000 60)))

(defn- living? [x] (= x :live))
(defn- alive-this-time? [x] (living? (grid x)))

(defn- alive-next-time? [offset]
  (let [indexes ((juxt #(- % 1) #(+ % 1) #(- % WIDTH) #(+ % WIDTH)
                       #(- % (inc WIDTH)) #(+ % (inc WIDTH))
                       #(- % (dec WIDTH)) #(+ % (dec WIDTH))) offset)
        vals (map grid indexes)
        num (count (filter living? vals))]
    (cond
     (or (> num 3) (< num 2)) :dead
     (= num 3) :live
     (and (= num 2) (alive-this-time? x)) :live
     :else
     :dead)))

(defn- update-model []
  (log/debug "update-model")
  (swap! grid #(init-random)))
         ;#(map-indexed alive-next-time? %)))



(defn add-listener [f]
  (add-watch grid nil
             (fn [k r o n]
               (f n))))

(defn poll []
  (let [timer (goog.Timer. 1000)]
    (do (update-model)
        (. timer (start))
        (events/listen timer goog.Timer/TICK update-model))))
