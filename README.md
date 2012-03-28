# London CLojure Dojo 27/03/2012 - Team 5 - Game Of Life

At the London Clojure Dojo on 27/03/2012 Team 5 produced a smoke and
mirrors implementation of the classic [Conway's Game Of Life][5]. The 
code shown there is the first checkin to this repo. But the
implementation has now been mostly complete and is working (for
certain definitions of working)

It's based on [lein-cljsbuild][1],
[Ring][2], and [Compojure][3].  But trys to focus only on the
clojurescript specifics (i.e. very minimal changes to the Ring and
Compojure stuff that come in the lein-cljsbuild simple example project)

It demonstrates the use of
lein-cljsbuild to build ClojureScript into JavaScript.

To play around with this example project, you will first need
[Leiningen][4] installed.

## Running the App

Set up and start the server like this:

    $ lein deps
    $ lein ring server-headless 3000

Now, point your web browser at `http://localhost:3000`, and see the web app in action!

[1]: https://github.com/emezeske/lein-cljsbuild
[2]: https://github.com/mmcgrana/ring
[3]: https://github.com/weavejester/compojure
[4]: https://github.com/technomancy/leiningen
