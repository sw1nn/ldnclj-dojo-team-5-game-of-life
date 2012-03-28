(ns example.log)

(def debugEnabled false)

(defn debug [ & s ]
  (when debugEnabled
    (.log js/console (apply str (cons "[DEBUG] " s)))))