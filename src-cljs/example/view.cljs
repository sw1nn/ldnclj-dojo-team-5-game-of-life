(ns example.view
  (:require [example.model :as model]
            [goog.dom :as dom]
            [example.log :as log]))


(defn by-id [id]
  (.getElement dom id))

(defn set-cell-state [x y state]
  (if-let [e (by-id (str x "-" y))]
    (if (= state :live)
      (.removeAttribute e "class")
      (.setAttribute e "class" (name state)))))

(defn grid-updated [grid]
  (log/debug "grid-updated" grid)
  (doall (map-indexed #(let [x (mod % WIDTH)
                             y (Math/floor (/ % HEIGHT))]
                         (set-cell-state x y %2)) grid)))

(model/add-listener grid-updated)

(set! (.-onload js/window) model/poll)