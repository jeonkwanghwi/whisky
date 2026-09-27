import Dexie from 'dexie';

// 노트 저장은 전부 이 파일을 거친다. 나중에 원격 백업을 붙일 때 여기만 바꾸면 된다.
const db = new Dexie('whisky-notes');
db.version(1).stores({ notes: 'id, createdAt' });

export const loadNotes = () => db.notes.toArray();
export const saveNote = n => db.notes.put(n);
export const saveNotes = ns => db.notes.bulkPut(ns);
export const removeNote = id => db.notes.delete(id);
