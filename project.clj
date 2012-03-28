(defproject ldnclj-dojo-team-5-game-of-life "0.1.0"
  :description "London CLojure Dojo Team 5 version of Conway's Game Of Life from 27/03/2012, based on  lein-cljsbuild"
  :source-path "src-clj"
  :dependencies [[org.clojure/clojure "1.3.0"]
                 [compojure "1.0.1"]
                 [hiccup "0.3.8"]]
  :dev-dependencies [[lein-ring "0.5.4"]]
  :plugins [[lein-cljsbuild "0.1.3"]]
  :cljsbuild {
    :builds [{:source-path "src-cljs"
              :compiler {:output-to "resources/public/js/main.js"
                         :optimizations :whitespace
                         :pretty-print true}}]} 
  :ring {:handler ldnclj-dojo-team-5-game-of-life.routes/app})
