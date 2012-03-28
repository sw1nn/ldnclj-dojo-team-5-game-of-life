(ns example.views
  (:use [hiccup core page-helpers]))

; When using {:optimizations :whitespace}, the Google Closure compiler combines
; its JavaScript inputs into a single file, which obviates the need for a "deps.js"
; file for dependencies.  However, true to ":whitespace", the compiler does not remove
; the code that tries to fetch the (nonexistent) "deps.js" file.  Thus, we have to turn
; off that feature here by setting CLOSURE_NO_DEPS.
;
; Note that this would not be necessary for :simple or :advanced optimizations.

(def ^:static WIDTH 100)
(def ^:static HEIGHT 50)

(defn- include-clojurescript [path]
  (list
    (javascript-tag "var CLOSURE_NO_DEPS = true;")
    (include-js path)))

(defn generate-table []
  [:table
   (for [ y (range HEIGHT) ]
     [:tr (for [x (range WIDTH)]
            [:td {:id (str x "-" y)} ])])])

(defn index-page []
  (html5
    [:head
      [:title "Conways's Game Of Life (hit refresh!)"]
     (include-clojurescript "/js/main.js")
     (include-css "/styles/default.css")
     ]
    [:body
     [:h1 "Conway's Game of Life (hit refresh!)"]
     [:div {:id "button"} "Start"]
     (generate-table)])
)