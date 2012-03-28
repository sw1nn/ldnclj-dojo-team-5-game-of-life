(ns ldnclj-dojo-team-5-game-of-life.views
  (:use [hiccup core page-helpers]))

; When using {:optimizations :whitespace}, the Google Closure compiler combines
; its JavaScript inputs into a single file, which obviates the need for a "deps.js"
; file for dependencies.  However, true to ":whitespace", the compiler does not remove
; the code that tries to fetch the (nonexistent) "deps.js" file.  Thus, we have to turn
; off that feature here by setting CLOSURE_NO_DEPS.
;
; Note that this would not be necessary for :simple or :advanced optimizations.

(defn- include-clojurescript [path]
  (list
    (javascript-tag "var CLOSURE_NO_DEPS = true;")
    (include-js path)))

(def title "London Clojure Dojo 27th March 2012 Team 5 - Game Of Life")
(defn index-page []
  (html5
    [:head
      [:title title]
     (include-clojurescript "/js/main.js")
     (include-css "/styles/default.css")
     ]
    [:body
     [:h1 title]
     [:div {:id "buttons"}]
     [:div {:id "content"} "Wait For It....."]]))