// js/folktalk.js — chunk 19: pressing A on a person shows their lines, with TALK registry

const TALK = [];
Folk.talk = npc => {
  if (!TALK.some(f => f(npc))) {
    say(npc.lines.map(line => npc.name + ': ' + line));
  }
};
