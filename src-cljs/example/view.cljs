(ns example.view
  (:require [example.model :as model]
            [example.log :as log]
            [example.repl :as repl]
            [goog.dom :as dom]
            [goog.events :as events]
            [clojure.browser.repl :as repl]))

(def ^:static WIDTH 100)
(def ^:static HEIGHT 50)


(defn- by-id [id]
  (.getElement goog.dom id))

(defn- set-cell-state [x y state]
  (log/debug "(set-cell-state " x " " y " " state ")")
  (if-let [e (by-id (str x "-" y))]
    (if (= state :dead)
      (.removeAttribute e "class")
      (.setAttribute e "class" (name state)))))

(defn update-view [grid]
  (doall (map-indexed #(let [x (mod % WIDTH)
                             y (Math/floor (/ % HEIGHT))]
                         (set-cell-state x y %2)) grid)))

(model/add-listener update-view)

(set! (.-onload js/window) model/poll)

