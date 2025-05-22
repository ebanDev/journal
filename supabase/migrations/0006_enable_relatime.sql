-- remove the supabase_realtime publication
drop
  publication if exists supabase_realtime;
-- re-create the supabase_realtime publication with no tables
create publication supabase_realtime;
commit;
-- add a table called 'messages' to the publication
alter
  publication supabase_realtime add table articles;
alter
  publication supabase_realtime add table issues;
alter
  publication supabase_realtime add table laveille;
alter
  publication supabase_realtime add table laveille_votes;
alter
  publication supabase_realtime add table members;
