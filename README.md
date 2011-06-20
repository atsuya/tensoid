# tensoid: sendoid without flash

`tensoid` is a technical attempt to do what [http://sendoid.com/](sendoid) does without flash.


## How to use

Access `tendoid` and drag and drop some file, and you'll get an URL. Tell this
URL to someone you want to share the file with. Make sure you are still on the
page when the someone opens the URL. That initiates a file transfer from your
browser to the someone's browser in realtime.


## Notes

Technically, `tensoid` does not do exactly how sendoid does its file transfer.
Sendoid uses flash and flash actually allows to do P2P communications among web
browsers. However, `tensoid` sends a chunk to server and the server sends it to
receiver. But you know, it doesn't use flash!

Other thing is a name of file downloaded. At the moment, it tries to download
with some weird name without file extension. You should rename the name,
especially the file extension to use it with appropriate application.


## Demo

To run your own `tensoid`, just git clone this repository and run:

    $ node app.js

Modify config.js to fit it to your environment.

Or try running demo at [http://tensoid.pictshare.me](http://tensoid.pictshare.me).


# Credits

Sendoid for a procedure to initiate file transfer (set file, get url, and let
receiver access it).


## License

`tensoid` is licensed under the MIT license.

The MIT License

Copyright (c) 2011 Atsuya Takagi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
