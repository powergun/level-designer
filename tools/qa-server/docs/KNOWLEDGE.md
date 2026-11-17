# qa-server knowledge

`@level-designer/qa-server` is the loopback server of the QA app. It owns its arguments,
the start and its failures, the routes, the page bundles, the run log and the marks file.
The level pipeline owns what the description builds; qa-client's protocol entry owns the
routes, the file names, the shapes and the admission of every request body.

## Entry and program

`run` takes the arguments after the program file and the surroundings: the loader of the
level pipeline, the lookup of qa-client's page files, the two output streams, the clock and
the stop request. It resolves with the exit status once the run log is closed. The program
file `main.ts` passes a dynamic import of `level-pipeline`, `qaClientPageFile`, the process
streams, the system clock and an abort signal. The first `SIGINT`, `SIGTERM`, `SIGHUP` or
`SIGBREAK` aborts it; a second one exits at once with status 1, and the run log then has no
last line.

The program file's static imports reach no sibling repository. The level pipeline reaches
sec-111 and destruction lib, so only the dynamic import loads it, after the sibling check.
qa-client's facade reaches sec-111's physics through `bootPage`, so production code imports
only qa-client's protocol entry.

## Arguments

- `--workdir <dir>`: required.
- `--sibling <dir>`: at least once; the QA recipe passes sec-111 and destruction-poc.
- `--port <n>`: a whole number from 0 to 65535, 4327 by default; 0 takes any free port.

Relative paths resolve against the current directory. An unknown option, a missing or
empty value, a positional argument or a bad port is a usage error: `qa-server: <problem>`
and the usage line on standard error, status 3, and no file is written.

## The start

The start runs five steps in order. Once the log is open, it gets `start: <step>` before
each later step (`sibling check`, `level`, `page bundles`, `port`) and the outcome after it.

1. The run log opens, and `run log <path>` prints on standard output at once, so every run
   names its log. A log that cannot be opened prints `qa-server: cannot open the run log
   <path>: <reason>` on the terminal alone, status 1.
2. The start facts go to the log: the process, the arguments, the work directory, the run,
   the run log and the marks file. Each sibling's absolute path follows with `install
   found`, `no install` or `no directory`. A missing directory fails with the fix to check
   the sibling out beside this repository; a directory without `node_modules` fails with
   the fix to run the sibling's own setup in its directory.
3. The pipeline loads, reads the committed description and the base stage, builds and
   validates. A loader that rejects, an unreadable description (`cannot read the
   description <path>: <reason>`) or a throw (`the level step failed at <read|build|
   validation>: <message>`) fails.
4. The page files are read and the two scripts bundled (section "The page").
5. The port is bound on `127.0.0.1`, and `serving http://127.0.0.1:<p>/` prints on
   standard output.

A taken port fails with `port <p> is taken or reserved; the server never moves to another
port`: Bun reports a port that another program holds and one in a range Windows reserves
alike. Any other bind error names the address and its message.

A failing step logs `start failed: <reason>` and the error's stack. It prints `qa-server:
<reason>` and the log's path on standard error, closes the log, and exits with status 1.
A start line that cannot be written prints on the terminal alone with status 1. A blocked
build and a rejected level are not failures. The log holds `build blocked: <n> errors`
and one `build error` line per error, or the level's name, hash and verdict with one
`finding` line per finding.

A stop request during the start prints at once `qa-server: stop requested (<reason>);
waiting for the running step: <step>` on standard error. It takes effect when that step
returns: the last line `stopped during the start: <reason>` goes to the log and to standard
error, and the status is 0.

## The run log

The run log is `<workdir>/qa/logs/qa-<YYYY-MM-DD>T<HH-MM-SS>.log` in local time; its name
without `.log` is the run name. It opens created new and append-only, so a second run
started in the same second fails to open its log, and no run appends to another's.

One event is one line: `<time> <source> <level> <text>`. The time is local ISO 8601 with
milliseconds and the UTC offset; a page line carries the page's clock. The source is
`server` or `page`, the level `info`, `warn` or `error`. The protocol's fold turns each
run of line terminators into one space, so no text can forge a line. Each line is one
synchronous write, so an abrupt end loses no written line.

The log records the start facts and steps, every request with its status and outcome,
each page line of a batch, a handler defect with its stack (its message when the stack is
empty), and the last line `stopped: <reason>`. The stop closes every connection before it
writes the last line, and standard error then prints `qa-server: stopped: <reason>; the
run log is <path>`, so a Ctrl+C ends with a word that the run ended and where its log is.
Bun maps a console Ctrl+C to `SIGINT` and, on Windows, a closed console to `SIGHUP`; the
program registers both, and only the human's QA confirms that they arrive. The tests prove
the abort path. A kill or a crash leaves no last line.

## The handler

Every request first passes the loopback rule, before anything parses its URL. `Host` must
be present and name `127.0.0.1` or `localhost`, and `Origin`, when present, must be an
`http:` origin on one of them; `Origin: null` is foreign. A breach answers `foreign-host`
with status 403 on every route. A `Host` that names no loopback host is refused even when
it breaks the request URL, such as `127.0.0.1:abc` or none in an HTTP/1.0 request. A
`Host` that names loopback is routed, so one that still breaks the URL, such as
`127.0.0.1:99999`, answers `not-found`; either way the request gets one JSON answer and
one request line. Bun itself answers a garbled request, an HTTP/1.1 request
without `Host` and a body above its 128 MB limit before the handler runs; those leave no
run log line.

- The page routes of the protocol answer the document, the style and the two bundles.
- `/level/<file>` answers the four level files of a built level, `no-level` while the
  build is blocked, and `not-found` for another name.
- `/api/session` answers the run, the run log and marks file paths, and the build: name,
  hash and verdict, or the build errors alone.
- `/api/log` admits a batch through the protocol and writes each page line.
- `/api/mark` appends one mark; see below.
- Every other method and path answers `not-found`.

A body that is not JSON is `malformed` at `$`. So is a body lost to a closed connection,
such as a page reloaded while a batch or a mark is in flight; its request line is a `warn`
line that names the lost body, not a defect. The protocol's admissions own every other
check and its status. Every answer the handler gives carries `Cache-Control: no-store`.
Every JSON answer carries `logFailure`: null, or the first reason a run log line of this
request could not be written. The request succeeds or fails on its own terms either way.
The server runs with Bun's development mode off, so a defect never sends source text.

A mark's body is admitted first, its run before anything else, so an old page's mark
always answers `other-run` and the page says `reload the page`. A mark of this run while
the build is blocked answers `no-level`. An admitted mark becomes one JSON
line in the marks file: `time`, `run`, `mark`, `level`, `description`, `mode`, `eye`,
`feet`, `yaw`, `pitch` and `comment`. One synchronous append writes it, and only a written
line takes the run's next number. A failed append answers `failed` with status 500 and
`cannot append to <path>: <reason>`. No `await` separates the admission from the append,
so two marks never share a number.

## The page

`qaClientPageFile` finds each page file through qa-client's page files entry, so no source
names a path. The document and the style are served as they are. The boot watch and the
page program are bundled for the browser in two separate builds, so the watch shares no
chunk with the program and still runs when the program fails to load. A page file that
cannot be read and a script that fails to bundle are start failures that name the file.

## What the tests prove

Every test runs `run` with a fake pipeline on sec-111's committed prepared level, captured
streams, a stepping clock and a temporary root that it removes. No test prepares a level.

The serving tests start real servers on temporary ports:

- One real server per file: the page and the four level files are served with their types
  and bytes. The real page boots against the real handler, and its batches reach the log.
- One mark appends exactly one line with every field. Another run's mark, a comment of
  2,001 characters, a malformed pose and a body that is not JSON are refused with their
  reasons and append nothing.
- A foreign `Host` or `Origin` is refused, and a request without `Origin` is served. A raw
  HTTP/1.0 request without `Host` and a `Host` of `127.0.0.1:abc` each get one JSON
  refusal and one request line. A body lost to a closed connection writes one `warn` line.

The same servers prove the session facts, the run log and the bundles:

- The session facts name the run, the run log, the marks file, the level and its hash. The
  log's name follows the run's start time, the steps appear in order, a page line with
  line feeds is folded, and every line has the line shape.
- The page program's bundle holds one three.js core, one Rapier root and no destruction
  lib module; the watch's bundle holds none of them.
- A blocked build serves its errors and no level file; a mark of this run hears
  `no-level`, an old page's mark `other-run`; a stop writes the last line and prints it
  with the run log's path. A marks file the file system refuses fails each mark once and
  logs each failure.

The start and wiring tests reach no server:

- Each usage error exits 3. A run log that cannot be opened, a missing sibling directory,
  a sibling without an install, an unreadable description, a pipeline that fails to load,
  a read, build or validation that throws (each named by its phase), a page file that
  cannot be read, a script that fails to bundle and a taken port each exit 1, logged with
  a folded stack and printed with the subject. Each prints the run log's path first.
- A stop during the start is told at once with the running step, then ends with status 0
  and its last line in the log and on standard error.
- A closed run log fails a start line on the terminal alone and never fails a request,
  whose answer names the reason. A defect with an empty stack answers one failure and
  logs its message. A bind error other than a taken or reserved port names the address.
- The program file's static imports reach no file outside the repository.

Its dependency documents:

- [level-pipeline knowledge](../../level-pipeline/docs/KNOWLEDGE.md);
- [qa-client knowledge](../../../packages/qa-client/docs/KNOWLEDGE.md);
- [sec111-gateway knowledge](../../../packages/sec111-gateway/docs/KNOWLEDGE.md);
- [level-format knowledge](../../../packages/level-format/docs/KNOWLEDGE.md).
