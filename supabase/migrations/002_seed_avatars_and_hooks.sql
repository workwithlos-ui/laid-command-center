-- Seed: 40+ system avatars + sample hooks library
-- Insert system avatars (subset shown — full list ported from SKILL avatar files)

insert into public.avatars (name, age, gender, description, image_prompt, is_system, tags) values
('Nadia', 27, 'female', 'Eastern European, platinum blonde bob, sharp and precise', 'A 27-year-old woman with pale cool-toned skin, ice-blue eyes, and sharp angular features is seated at a small round table near a window. Her straight platinum-blonde hair falls to her chin in a clean blunt bob. She''s wearing a black ribbed long-sleeve turtleneck, fitted and heavyweight, with a thin silver watch on her left wrist. One arm rests on the table, elbow down, fingers hanging loosely off the edge. Her expression is sharp and deliberate — like she''s already three moves ahead and choosing her words carefully. In the background, a blurred white wall with a single framed architectural print, a small ceramic espresso cup on the table, and a blurred city window. Flat overcast morning light, even across her face with subtle cool shadows beneath her cheekbones. Minimal skin imperfections, clean brows, no airbrushing. Subtle film grain, slightly desaturated color grade. iPhone UGC style photo, medium shot and candid — like she''s a creator filming a talking-head video about something she actually knows deeply. No phones or cameras visible. Eye-level shot as if the camera is propped on the table across from her.', true, array['professional','tech','b2b','minimalist']),
('Rosa', 31, 'female', 'Latina, golden-tan skin, floral oversized top, warm and inviting', 'A 31-year-old woman with warm golden-tan skin, dark brown eyes, and a wide natural smile is sitting cross-legged on a beige linen sofa in her living room. Her thick dark wavy hair falls to the middle of her back, slightly tousled. She''s wearing a floral oversized short-sleeve top in rust and cream tones, untucked, with small gold hoop earrings. One hand rests on her knee, palm up and relaxed. Her expression is animated and inviting — like she''s mid-laugh and about to pull you into the story. In the background, a blurred side table with a small candle and a plant, a floor lamp casting a warm pool of light, and a gallery wall with framed art prints barely visible. Warm golden afternoon light from a window to the right. Natural skin texture with a slight glow on the cheekbones, no airbrushing. Subtle film grain, slightly desaturated natural color grade. iPhone UGC style photo, medium shot and candid — like she''s a creator filming a talking-head video about something she actually knows deeply. No phones or cameras visible. Eye-level shot as if the camera is propped on the coffee table in front of her.', true, array['lifestyle','coaching','warm','approachable']),
('Corey', 29, 'male', 'Athletic, hoodie, garage gym vibe', 'A 29-year-old athletic man with light olive skin, short brown buzzcut, and a clean-shaven face is sitting on a weight bench in a converted garage gym. He''s wearing a heather grey hoodie, sleeves pushed up to the elbows. Forearms relaxed on his knees, leaning forward slightly. Confident half-smile — like he''s about to drop a take you didn''t expect. Background: blurred squat rack, dumbbells on a black rubber floor, a single overhead industrial light. Mid-morning natural light spilling through an open garage door behind camera. Natural skin, slight stubble, subtle film grain. iPhone UGC style, eye-level, medium shot. No camera or phone visible.', true, array['fitness','masculine','direct','aggressive'])
on conflict do nothing;

-- Seed hooks library (sample from hooks-library.md — full 1000+ ported via separate script)
insert into public.hooks (category, template, placeholder_count, is_outlier) values
('educational', 'The reason (insert X) is so (insert Y) is because (insert Z)', 3, true),
('educational', 'Most people think (insert X), but the truth is (insert Y)', 2, true),
('educational', 'Here''s how to (insert X) in (insert time) without (insert pain point)', 3, false),
('comparison', '(Option A) vs (Option B): which actually wins?', 2, false),
('comparison', 'I tried (insert X) for 30 days. Here''s what nobody tells you', 1, true),
('myth_busting', 'You''ve been told (insert myth). It''s wrong, and here''s why', 1, true),
('myth_busting', 'Stop doing (insert X). Here''s what works instead', 1, false),
('curiosity', 'I just discovered (insert X) and it changes everything about (insert Y)', 2, true),
('curiosity', 'There''s one thing (insert group) won''t tell you about (insert X)', 2, true),
('controversy', 'Unpopular opinion: (insert X) is overrated', 1, false),
('controversy', '(Insert authority figure) is wrong about (insert X). Here''s the proof', 2, true),
('warning', 'If you''re doing (insert X), stop. You''re costing yourself (insert outcome)', 2, true),
('warning', '99% of (insert group) make this mistake with (insert X)', 2, false),
('storytelling', 'Last (insert time period), I (insert event). Here''s what I learned', 2, false),
('storytelling', 'I lost $(insert amount) so you don''t have to. Here''s the lesson', 1, true),
('result', 'How I went from (insert before) to (insert after) in (insert time)', 3, true),
('result', '(Insert metric) increased by (insert %) using this one change', 2, false),
('listicle', '7 (insert thing) that will (insert outcome) in 2026', 2, false),
('listicle', '3 (insert tools) every (insert role) needs to know about', 2, false),
('question', 'Why does (insert X) work for some people and not others?', 1, false);
-- ... actual seed will load from hooks-library.md via parser script (loadHooks.ts)
