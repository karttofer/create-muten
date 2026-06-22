// Welcome-page code block (a `Custom` host component — the escape hatch for anything muten can't express).
// The snippet lives here in JS so it can contain quotes and { } that a .muten string can't. Delete with
// the welcome page. Used from home.muten as: Custom Snippet
const CODE = `screen home

state { count = 0 : number }
action inc mutates count { count.set(count + 1) }

Page style(padding.lg, gap.md) {
  Title "Count: {count}"
  Button "+1" -> inc
}`;

function mount(el) {
  const pre = document.createElement('pre');
  pre.className = 'snippet';
  pre.textContent = CODE;
  el.appendChild(pre);
}
