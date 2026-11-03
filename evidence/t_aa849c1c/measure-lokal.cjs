// Misst Lokal.html commit-gebunden aus den Git-Blobs: LF-Blob und CRLF-Aequivalent.
// Aufruf: node measure-lokal.cjs <repo> <rev> [...weitere revs]
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repo = process.argv[2];
const revs = process.argv.slice(3);
if (!repo || revs.length === 0) {
  console.error('usage: node measure-lokal.cjs <repo> <rev>...');
  process.exit(2);
}

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: repo, maxBuffer: 64 * 1024 * 1024, ...opts });
}

function toCrlf(buf) {
  // Zeilenenden vereinheitlichen (LF), dann jedes LF durch CRLF ersetzen.
  const lf = buf.toString('utf8').replace(/\r\n/g, '\n');
  return Buffer.from(lf.replace(/\n/g, '\r\n'), 'utf8');
}

function lineEnds(buf) {
  let crlf = 0;
  let lf = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 10) {
      lf++;
      if (i > 0 && buf[i - 1] === 13) crlf++;
    }
  }
  return { crlf, lfOnly: lf - crlf };
}

const rows = [];
for (const rev of revs) {
  const commit = git(['rev-parse', '--verify', `${rev}^{commit}`]).toString().trim();
  const blobId = git(['rev-parse', `${commit}:Lokal.html`]).toString().trim();
  const blob = git(['cat-file', 'blob', blobId]);
  const row = {
    rev,
    commit,
    blob: blobId.slice(0, 8),
    lfBytes: blob.length,
    crlfBytes: toCrlf(blob).length,
    lines: blob.toString('utf8').split('\n').length - 1,
    blobLineEnds: lineEnds(blob),
  };

  // Arbeitsbaum nur melden, wenn dort derselbe Blob liegt (sonst waere der Wert irrefuehrend).
  const worktreeFile = path.join(repo, 'Lokal.html');
  try {
    const headBlob = git(['rev-parse', 'HEAD:Lokal.html']).toString().trim();
    if (fs.existsSync(worktreeFile) && headBlob === blobId) {
      const onDisk = fs.readFileSync(worktreeFile);
      row.worktreeBytes = onDisk.length;
      row.worktreeLineEnds = lineEnds(onDisk);
    }
  } catch (err) {
    row.worktreeNote = String(err.message || err);
  }
  rows.push(row);
}
console.log(JSON.stringify(rows, null, 2));
