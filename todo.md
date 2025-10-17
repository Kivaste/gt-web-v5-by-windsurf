- [x] hero page animated navigation should be delayed even when the reduce motion is enabled
- [x] Copy the hero slide scroll indicator but without the delay and animation (position should be fixed to the bottom of the animation range) and add that for all the pages except red banner and second CTA
- [x] yellow banner - fix mobile: add 10% of height, add a bit of white space to the sides
- [x] hooked slide - Select the stage to place in this slot: this selector should act more like a popup or a dropdown menu that comes on top of the other content, rather than an extra container that is hidden and shown on click.
- [x] Data > Oil: put the button click counters to the second column, right to the device info
- [x] comments/These tools are too powerful!: fix the comments box to have the same font, text size etc like the email box'
- [x] What is gadgetTaming?: copy
- [x] Hooked: interaction
- [x] Which of these have influenced you negatively? => Which tricks have gotten you?



- [ ] Data > Oil: when pressing the button don't show "Guess location" during the loading animation
- [ ] Data > Oil: add to the end: Spooky? Sum everything up and multiply by 100,000,000 users = beyond spooky!
- [ ] CTA panels: when clicking a mouse or keyboard back button or doing a back swipe gesture then it should close the panel not go to the previous browser page or slide
- [ ] mouse or keyboard back button or doing a back swipe gesture be going to previous slide instead of previous browser page?
- [x] make the popup buttons go to next slide only when the popup appears within the first 5 slides (hero, whysimilar, yellow banner, red banner, personal note), after that the buttons should just close the popup and remain in the same slide


- [ ] Who am I?: copy
- [ ] Recap: copy
- [ ] Hooked: copy
- [ ] CTA slideouts
- [ ] Persuasion tricks in plain sight: copy








------------

- [ ] hosting
    - [ ] cloudflare worker
- [ ] posthog for analytics





-----------

$99 not $100	Looks cheaper	Brain rounds down
Was $500, now $99	Anchor high, discount hard	Feels like a steal
Money-back guarantee	Kill risk	(You won't refund anyway)
Testimonials	Prove it works	Herd mentality
FAQ	Preempt objections	Smooth to "yes"
Progress bar	Keep you moving	Sunk cost fallacy
Scarcity	Panic buy	FOMO kicks in
Timer	Decide now	Urgency shorts logic


Element	Goal	Why it works
Charm pricing (.99/.97)	Make it feel cheaper	Left-digit bias
Anchor + big discount	Make the deal look huge	Anchoring, contrast
Decoy pricing (bad middle plan)	Steer you to the “right” plan	Asymmetric dominance
Free shipping threshold	Upsize your cart	Goal-gradient, mental accounting
BNPL/installments	Lower purchase pain	Present bias, partitioned pricing
Money-back guarantee	Remove risk	Risk reversal, loss aversion
Trust badges (SSL, logos)	Calm checkout anxiety	Authority signals, uncertainty reduction
Testimonials/ratings	Borrow credibility	Social proof, herd behavior
FAQ	Kill objections fast	Cognitive fluency, clarity
Scarcity/urgency (countdowns, low stock)	Force “now,” prevent delay	FOMO, scarcity heuristic
Progress meters (forms/checkout)	Keep you finishing	Goal-gradient, endowed progress
One clear CTA	Direct your click	Choice overload reduction, salience
Exit‑intent pop-up	Catch last‑chance conversions	Interruption, loss aversion
Retargeting (ads/emails)	Pull you back	Mere exposure, Zeigarnik effect




These tools are too powerful - you have no chance against them. 







--------

----
to recap perhaps

for better knowledge retention you should be doing the recap, but let me help you this time.

There are two industries that call their customers 'Users': tech and the shady guys close to the entrance of a rave party.

If you feel that your gadets are controlling you, instead of the other way around then know that it's not your fault, it is by design!

----------


Tech at it's best
productivity
creativity
connection

Tech at it's worst

distraction
pure consumption
loneliness

I've experienced the highest peaks and the lowerst black holes. Hence I'm a Technophile and a Tehnocritic (Technosceptic)


-----------------------

HOOKED

no, seriously, the book is called literally 'Hooked: How to Build Habit-Forming Products'

-----

ABOUT ME
All of the above is true - I'm a techie who has been abused by tech. Tech has been my passion, my hobbie, my career and my unhealthy coping mechanism and cause for distress. 

My dad was a programmer so I've had a computer at home since I can remember. My youth was spent gaming all night and then skipping school. 


I think I have been ahead of the curve with the struggles as well as the solutions.


-----
If you think this site is worth sharing then ... well you gotta fight fire with fire. Share it on social media :)


-----

recap
which of these have you experienced?
which of these have the biggest impact on you?

-----

about me

Kert Kivaste is my name and this is my face:
Supposedly adds credibility.

..
I'm a techie who has been abused by tech. Tech has been my passion, my hobbie, my career and my unhealthy coping mechanism and cause for distress. 

----

If you think this site is cool then ... well you gotta fight fire with fire. Please share it :)

---

Pricing 
- 99 97 let's be honest it's a 100
- 
Money back guarantee
Testimonials / social proof
FAQ
progress meters


----

Ready for me to solve all your problems?*
* this is a 
--------
Spooky? Consider everything you've seen and multiply it with tens or hundreds of millions of people. Spooky is an understatement.
-----




Step-by-Step Testing Plan
Refresh localization
Load the site and ensure translations have reinitialized (or manually trigger the localization script) so new strings from 
content/en.json
 appear.
Verify Data Trail layout
Navigate to the Data > Oil slide and confirm:
“Stats” and “Clicks” headings align with bullets and are underlined.
Guess-location button spans the full column width and reduced gap to the note.
Clicking multiple CTA buttons plus the guess button shows only five bullet entries including the guess button.
Test Hooked interaction


On the Holy grail slide, check that each slot initially reads “Select stage N” centered, and once a stage is chosen the placeholder disappears, showing only the chosen stage and description. Deselect/reassign to ensure placeholders return.
Inspect Comments slide
Verify the title “It's hopeless!”, the new intro paragraph, and that the textarea font/size matches the email input. Check that the localization still applies to placeholders and labels.
Review Tricks slide
Confirm the heading reads “Some more persuasion tricks in plain sight” and the updated table rows display exactly the new text.
Regression spot-check
Scroll through neighboring slides (e.g., Cookies) to confirm the adjusted copy (Oxford comma) appears and that no unexpected layout shifts occurred after the CSS changes.
Optional cross-device check
Resize to ≤640px width to ensure Data Trail layout, hooked slots, and comments form remain consistent with the mobile-specific CSS adjustments.

- Button labels (click counter)
  - "Scroll to next section" → "Scroll next"
  - "Free webinar" → "Webinar"
  - "Course: self-paced" → "Self-paced course"
  - "Course: live cohort" → "Live course"
  - "Team training" → "Team training"
  - "Discovery call" → "Book call"
  - "Donate" → "Donate"
  - "A" → "Variant A"
  - "B" → "Variant B"
  - "Select stage 1" → "Stage 1 slot"
  - "Select stage 2" → "Stage 2 slot"
  - "Select stage 3" → "Stage 3 slot"
  - "Select stage 4" → "Stage 4 slot"
  - "Close stage selector" → "Close picker"
  - "Trigger" → "Trigger"
  - "Action" → "Action"
  - "Variable Reward" → "Reward"
  - "Investment" → "Investment"
  - "Guess location" → "Guess location"
  - "Post comment" → "Post comment"
  - "Close dialog" → "Close popup"
  - "I see what's going on!" → "I see what's going on!"
  - "WTF is happening?" → "WTF is happening?




Hooked model selector popup:
1. Rounded corners change to 90degree corners
2. Stage background full black
3. close X mark - copy the other pop up look exactly
4. remove the horizontal line
5. change copy: 'Select the stage to place in this slot.' => 'Select the stage'
 
 

Simple behavior in anticipation of reward => Simplest next behavior



Trigger (scripts/hooked.js:1-7)
Cue that prompts you to act. 
Examples: Push notification, Inbox badge, Boredom scroll.

Action (scripts/hooked.js:8-13)
Simple behavior in anticipation of reward. 
Examples: Open the app, Swipe to refresh, Tap the play button.

Variable Reward (scripts/hooked.js:14-19)
Unpredictable payoff that hooks attention. 
Examples: New likes or comments, Loot drop, Fresh content.

Investment (scripts/hooked.js:20-25)
Effort that increases the product’s future value. 
Examples: Upload a photo, Follow friends, Save preferences.


------------


gadgetTamer 7 Pillars:

1. Understand the design (goals and principles)

a) Profit maximization through selling your time and attention
b) Hook model, Skinner box, friction as growth brake

2. Measure, become aware, decide on your usage
a) Screen time is just one number—what's behind it?
b) Phone unlocks, usage times, app categorization

3. Remove triggers
a) Notifications, Modes/Focus Modes

4. Design your digital environment: add friction to the undesirable
a) Make automatic behavior conscious and harder; bring attention back

5. Eliminate slip-ups: design access
a) Does everything need 24/7 access from every device?
b) Access based on device, account, time, usage limit, or location

6. Curate your info diet: who, when, and how should reach you?
a) Email, newsletters, social media feeds

7. What to replace it with: remove friction from real goals


----

gadgetTamer’s 7 pillars:

1. Understand design (goals and principles)

    Increasing profit by selling your time and attention
    The Hook Model, Skinner box, friction as a brake on growth

2. Measure, notice, and decide on your usage (now vs. future self)

    Screen time is just one number—what’s behind it?
    Phone unlock count, times of use, app categorization

3. Remove triggers

    Notifications, Modes/Focus Modes

4. Build your own digital environment—add friction to the undesirable

    Surface and hinder automatic behavior; bring your attention back

5. Eliminate chances to slip—design access

    Do you need 24/7 access to everything from every device?
    Gate access by device, account, time of day, usage amount, or location

6. Curate your information diet—who, when, and how should be able to reach you?

    Email, newsletters, social feeds

7. What will you replace it with—in other words, remove friction from your real goals



-------

ET

 🚨 Eripakkumise bänner - tekitab kiirustamist ja sunnib tegutsema! 🚨 
 => 
 🚨 Eripakkumise bänner sunnib kiirustades tegutsema! 🚨 

Tegutse kohe Võta aega, lõpeb:
=>
 Kiirusta! Võta vabalt, aega lõpuni:



 Nende eesmärk pole sind informeerida - need on häälestatud masinad, mis juhivad sind pangakaarti sisestama.