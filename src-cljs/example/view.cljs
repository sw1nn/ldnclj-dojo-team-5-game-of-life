(ns ^{ :doc "UI concerns, displays the grid and listens for changes in the model, updating when it sees them"}
  example.view
  (:require [example.model :as model]
            [example.log :as log]
            [goog.dom :as dom]
            [goog.events :as events]))

(defn- by-id [id]
  (.getElement goog.dom id))

(defn- set-cell-state
  "adds a live CSS class attr to live cells, cells are <TD> elements in an HTML table with id of <x>-<y>"
  [x y state]
  (if-let [e (by-id (str x "-" y))]
    (if (= state :dead)
      (.removeAttribute e "class")
      (.setAttribute e "class" (name state))))xs)

(defn update-view
  "callback that is called when the grid state changes, processes the grid sequence and updates the corresponding cells in an HTML table"
  [grid]
  (log/debug "update-view" grid)
  (doall (map-indexed #(let [x (mod % model/WIDTH)
                             y (Math/floor (/ % model/WIDTH))]
                         (set-cell-state x y %2)) grid))
  (log/debug "update-view-end"))


(defn- create-table
  "Build an HTML table to act as our grid: TODO hiccup like library for the client side (moustauche does this?)"
  []
  (set! (.-innerHTML (by-id "content"))  
             (apply str (flatten
                         ["<table id='game-of-life'>"
                          (for [ y (range model/HEIGHT) ]
                            ["<tr>" (for [x (range model/WIDTH)]
                                      [(str "<td id='" (str x "-" y) "'>") ])
                             "</tr>"] )
                          "</table>"]))))
(defn initialise []
  (create-table)
  (model/toggle-run)
  (model/add-listener update-view))


;; must be after iniialise method. registers a callback on the onload
;; DOM event. We need to wait for the page to have loaded before we
;; start accessing the DOM.
(set! (.-onload js/window) initialise)

