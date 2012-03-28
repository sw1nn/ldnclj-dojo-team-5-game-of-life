(ns example.log)

(defn debug [ & s ]
  (.log js/console (apply str (cons "[DEBUG] " s))))