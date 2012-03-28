(ns ldnclj-dojo-team-5-game-of-life.log)

(def debugEnabled false)
(def infoEnabled true)

(defn- log [level s]
  (.log js/console (apply str (cons (str "[" level "] ") s))))

(defn debug [ & s ]
  (when debugEnabled
    (log "DEBUG" s)))

(defn info [ & s ]
  (when infoEnabled
    (log "INFO" s)))