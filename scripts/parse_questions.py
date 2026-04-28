import json
import re

raw_text = """
Batch 2: Questions 26–50
Q26. MGIEP, UNESCO’s first education-related institute in the Asia-Pacific region, is situated in which country?

A) Japan

B) China

C) Thailand

D) India (New Delhi)

Q27. ___ heritage is a vital driver of sustainability:

A) Financial

B) Industrial

C) Political

D) Cultural and Natural (Heritage)

Q28. The transformative power of culture is increasingly recognized as a key enabler for:

A) Military power

B) GDP growth only

C) Technological domination

D) Social inclusion and resilience

Q29. Cultural heritage promotes creativity, productivity, and:

A) Isolation

B) Competition

C) Materialism

D) Spiritual thoughts

Q30. Which target calls for strengthening efforts to protect and safeguard the world’s cultural and natural heritage?

A) Target 11.4

B) Target 4.7

C) Target 1.1

D) Target 6.2

Q31. The ability to create good relationships, relate well with others, and adapt to social situations is called:

A) Physical health

B) Mental health

C) Social health

D) Economic health

Q32. ___ is a personal commitment to taking responsibility for your own health through proactive means:

A) Medical insurance

B) Physical fitness

C) Sustainable health

D) Public health

Q33. SDG 3 aspires to ensure health and well-being for all by:

A) 2025

B) 2030

C) 2040

D) 2050

Q34. The right amount of ___ engagement keeps us fit and leads to a long, stress-free life:

A) Financial

B) Physical

C) Social media

D) Political

Q35. Which sectors have crucial roles in building healthy communities, towns, and cities?

A) Public and Private

B) Non-profit

C) Individual

D) All of the above

Q36. Mental health is a state of ___ in which the individual realizes her own abilities:

A) Well-being

B) Excitement

C) Physical strength

D) High intelligence

Q37. Which of the following is a non-communicable disease (NCD)?

A) COVID-19

B) Malaria

C) Diabetes

D) HIV/AIDS

Q38. Dimensions of health include:

A) Physical

B) Mental

C) Social

D) All of the above

Q39. Nutritional requirements vary according to:

A) Body mass

B) Physical activity

C) Environment

D) All of the above

Q40. Human health and survival are understood to be completely dependent on the presence of intact:

A) Stock markets

B) Digital networks

C) Ecosystems and Biodiversity

D) Legal systems

Q41. Which of the following is being used as health care technology?

A) Telemedicine

B) Mobile hospitals

C) Ultra-sonography

D) All of the above

Q42. Health care ___ integrate data storage, analysis, and knowledge access to improve patient care:

A) Policies

B) Grids / Digital Systems

C) Insurance

D) Buildings

Q43. Sustainable Quality Improvement (SusQI) is a framework that includes:

A) Ecological sustainability

B) Long-term socio-economic perspectives

C) Both A and B

D) None of the above

Q44. ESD (Education for Sustainable Development) is a process of:

A) Short-term training

B) Lifelong learning

C) Examination only

D) One-time awareness

Q45. To measure and track hunger at global, regional, and national levels, we use:

A) GDP

B) Literacy rate

C) The Global Hunger Index (GHI)

D) Stock index

Q46. Food insecurity occurs when:

A) Food is unavailable

B) People lack resources to buy food

C) Nutrition is insufficient

D) All of the above

Q47. During the COVID-19 pandemic, which systems were overburdened?

A) Financial

B) Health care

C) Entertainment

D) Transport

Q48. Which of the following is NOT a part of human capital?

A) Knowledge

B) Skills

C) Landholding

D) Health

Q49. Which of the following is an example of physical capital?

A) Education

B) Consumer durables / Infrastructure

C) Health

D) Intelligence

Q50. The COVID-19 pandemic increased the risk of malnutrition due to the impact of:

A) Lockdowns

B) Social distancing

C) Quarantining

D) All of the above

Batch 3: Questions 51–75
Q51. ___ are closely related to issues of poverty and food insecurity:
A) Technologies
B) Diseases
C) Markets
D) Laws
Q52. Another form of malnutrition, characterized by micronutrient deficiency, is known as:
A) Overnutrition
B) Hidden Hunger
C) Underweight
D) Obesity
Q53. The most serious long-term challenge being faced by Indian agriculture is:
A) Global warming and climate change
B) Lack of labor
C) High seed prices
D) Lack of machinery
Q54. Maternal education is positively associated with children's:
A) Better health
B) Better education
C) Better nutrition
D) All of the above
Q55. Which of the following is NOT a sustainable agriculture practice?
A) Crop rotation
B) Excessive use of pesticides and fertilizers
C) Organic farming
D) Drip irrigation
Q56. Which of the following are causes of climate change?
A) $CO_2$ (Carbon dioxide)
B) $CH_4$ (Methane)
C) $N_2O$ (Nitrous oxide)
D) All of the above
Q57. 1 inch of rainfall on a 2000 square foot roof is approximately equal to:
A) 1,250 Gallons of water
B) 500 Gallons
C) 100 Gallons
D) 2,000 Gallons
Q58. Which of the following is NOT a primary role of the private sector in food security?
A) Innovation
B) Weakening government institutions
C) Investment
D) Distribution
Q59. Current cultivation of cash crops for export purposes, such as ___, contributes to food insecurity:
A) Cotton and Coffee
B) Wheat and Rice
C) Corn
D) Potatoes
Q60. Which of the following is NOT a core part of critical system modeling?
A) Systems thinking
B) Simple Anticipation
C) Problem-solving
D) Critical thinking
Q61. Renewable energy technologies provide:
A) Energy services (Heat, light, mobility)
B) Only electricity
C) Only fuel for cars
D) Only industrial power
Q62. What can be considered a source of clean and sustainable energy?
A) Coal
B) Oil
C) Hydrogen
D) Natural Gas
Q63. The ___ Agreement is a legally binding international treaty on climate change:
A) Kyoto
B) Delhi
C) New York
D) Paris
Q64. Which energy source does NOT require massive infrastructure investment compared to others?
A) Nuclear
B) Bioenergy
C) Large-scale Hydro
D) Natural Gas grids
Q65. Which initiative raised the flag for Higher Education as a driver of sustainability in 2020?
A) UN Security Council
B) HESI (Higher Education Sustainability Initiative)
C) World Bank
D) WTO
Q66. One of the priority areas of the ESD 2030 framework is:
A) Empowering and mobilizing youth
B) Increasing industrial output
C) Building more highways
D) Private space travel
Q67. Which of the following is a breakthrough "green" technology?
A) Traditional tractors
B) Zero-carbon bio-fertilizers
C) Diesel engines
D) Coal furnaces
Q68. ___ research bridges basic science and practical application in clean energy:
A) Fundamental
B) Historical
C) Translational
D) Abstract
Q69. Hydrogen for clean energy is produced mainly from which process?
A) Thermo-chemical
B) Magnetic
C) Mechanical
D) Acoustic
Q70. ___ of the energy economy is critical for mitigating climate change:
A) Expansion
B) Centralization
C) Decarbonization
D) Privatization
Q71. According to the Frame Model, which goals are relevant for developing sustainability competencies?
A) Cognitive, Motivational, and Behavioral
B) Only Financial
C) Only Technical
D) Only Political
Q72. Which is a policy support mechanism of the Okayama Project?
A) Networking and Partnership
B) Military enforcement
C) Trade tariffs
D) Isolationism
Q73. ___ aims to empower learners to question and change their ways of thinking about the world:
A) Rote learning
B) Basic literacy
C) Vocational training
D) Transformative learning
Q74. Which pedagogy sees students as autonomous learners and emphasizes active development of knowledge?
A) Teacher-centered
B) Subject-centered
C) Learner-centered
D) Curriculum-centered
Q75. The ability to collectively develop and implement innovative actions for sustainability at local and global levels is:
A) Basic literacy
B) Strategic competency
C) Mathematical skill
D) Memory power

Batch 4: Questions 76–100
Q76. Which approach looks at problems in a holistic perspective where issues are linked as part of a whole?
A) Linear thinking
B) Reductionist thinking
C) Subjective thinking
D) Systems thinking

Q77. The ability to understand and reflect on norms and values that underlie one’s actions is called:
A) Strategic competency
B) Normative competency
C) Anticipatory competency
D) Systems thinking

Q78. In ___ learning, learners engage in action and reflect on their experiences in relation to personal development:
A) Rote
B) Passive
C) Action-oriented
D) Theoretical

Q79. ___ is defined as the ability to stay present to your internal environment while engaging with your external environment:
A) Multi-tasking
B) Daydreaming
C) Presencing
D) Externalizing

Q80. Collaboration, mediation, teamwork, and empathy come under which competencies?
A) Strategic
B) Interpersonal
C) Cognitive
D) Technical

Q81. The ability to work with feedback loops, subsystems, and tipping points is part of:
A) Strategic thinking
B) Systems thinking
C) Financial planning
D) Creative writing

Q82. Deep sustainability transformation involves changes in individual actions intertwined with:
A) Industrial expansion
B) Military strength
C) Profit margins
D) Soceital structures

Q83. Which of the following is NOT a step of Mezirow’s theory of transformative learning?
A) Competitive action
B) Disorienting dilemma
C) Critical assessment
D) Building competence

Q84. Through ___ development, people influence and share control over initiatives and resources that affect them:
A) Top-down
B) Participatory
C) Dictatorial
D) Secretive

Q85. According to NEP 2020, the new school structure in India is:
A) 5 + 3 + 3 + 4
B) 10 + 2
C) 5 + 4 + 3 + 2
D) 8 + 4

Q86. In recent years, ___ has become a slogan for rallying social, economic, and environmental awareness:
A) Sustainability
B) Globalization
C) Privatization
D) Modernization

Q87. SDG 4 primarily aims for:
A) Quality and Inclusive Education
B) Zero Hunger
C) Clean Water
D) Gender Equality

Q88. Which body is proposed to be the common regulatory body for all higher education in India?
A) UGC
B) AICTE
C) NCTE
D) HECI (Higher Education Commission of India)

Q89. Sustainable Leaders look beyond immediate short-term gains to see the role the organization plays in a:
A) Stock market
B) Larger context / Society
C) Local competition
D) Single department

Q90. To embrace sustainable leadership, leaders should focus on the "Three Ps":
A) Power, Prestige, Profit
B) People, Planet, Profit
C) Planning, Policy, Production
D) Price, Product, Promotion

Q91. Understanding and working with paradox, ambiguity, and conflict is a sustainable leadership:
A) Habit
B) Attitude
C) Talent
D) Practice

Q92. Displaying an unbiased attitude toward new ideas and beliefs of other stakeholders is called:
A) Open-mindedness
B) Skepticism
C) Conservatism
D) Stubbornness

Q93. One who engages in creating transformative change toward a sustainable future is known as a:
A) Financial manager
B) Sustainability Leader
C) Technical specialist
D) Political strategist

Q94. Sustaining energy and momentum in a team is a leader's:
A) Responsibility
B) Option
C) Hobby
D) Burden

Q95. Principles of sustainability leadership include:
A) Shared responsibility
B) Innovation and collective learning
C) Activist engagement
D) All of the above

Q96. Sustainable leadership provides ___ that helps attract and retain the best talent:
A) Intrinsic motivation
B) Only high salaries
C) Strict rules
D) More office space

Q97. Maintaining "Lean" management systems is a principle of:
A) Autocratic leadership
B) Traditional leadership
C) Chaotic leadership
D) Lean Leadership

Q98. In sustainable leadership, the key performance drivers are:
A) Innovation
B) Engaged employees
C) High quality
D) All of the above

Q99. Managing complexity and unpredictability is a learned ___ for a leader:
A) Norm
B) Skill
C) Burden
D) Coincidence

Q100. External leadership actions include:
A) Cross-sector partnerships
B) Stakeholder transparency
C) Context transformation
D) All of the above

Batch 2: Questions 101–125
Q101. Sustainable leadership competencies include:
A) Sustainable mindset
B) Systems thinking
C) Relationship building
D) All of the above

Q102. Which is a core value at the Lead India leadership program?
A) Competition
B) Profit maximization
C) Building empathy
D) Strict hierarchy

Q103. ___ has transformed the world into a "global village":
A) Isolationism
B) Globalization
C) Protectionism
D) Colonization

Q104. Which leadership style serves to enhance motivation and job performance of followers through various mechanisms?
A) Autocratic
B) Transactional
C) Passive
D) Transformational

Q105. Sustainable ___ considers how to minimize inputs (energy, water) and reduce waste outputs:
A) Planning
B) Consumption
C) Competition
D) Marketing

Q106. Sustainable communities are:
A) Economically productive
B) Socially inclusive
C) Environmentally resilient
D) All of the above

Q107. Common urban challenges include ___ due to lack of funds and poor infrastructure:
A) Traffic congestion
B) High literacy
C) Over-employment
D) Excess green space

Q108. Climate change impacts cause:
A) Rising sea levels
B) Extreme weather events
C) Altered precipitation
D) All of the above

Q109. Which autonomous agency serves an advisory role to the Indian government on pollution control?
A) CPCB (Central Pollution Control Board)
B) UNESCO
C) World Bank
D) IMF

Q110. Which type of industrial waste is particularly dangerous because it is toxic, flammable, or corrosive?
A) Hazardous waste
B) Organic waste
C) Inert waste
D) Recyclable waste

Q111. Which SDG relates to "Responsible Consumption and Production"?
A) SDG 3
B) SDG 7
C) SDG 9
D) SDG 12

Q112. There is a need to make ___ more sustainable, particularly in industrial societies:
A) Consumption patterns
B) Military spending
C) Entertainment choices
D) Space exploration

Q113. Which SDG focuses on "Partnerships for the Goals"?
A) SDG 1
B) SDG 5
C) SDG 10
D) SDG 17

Q114. A successful sustainable development agenda requires partnerships between:
A) Government
B) Private sector
C) Civil society
D) All of the above

Q115. "I want to save time and labor... for all mankind... not in the hands of a few." This statement was given by:
A) Jawaharlal Nehru
B) Nelson Mandela
C) Mahatma Gandhi
D) B.R. Ambedkar

Q116. The Triple Bottom Line drivers of sustainable development are:
A) Social, Economic, and Ecological
B) Local, National, Global
C) Past, Present, Future
D) Planning, Policy, Power

Q117. Management of water, sanitation, and hygiene (WASH) comes under which SDG?
A) SDG 1
B) SDG 4
C) SDG 6
D) SDG 11

Q118. ___ plays a part in many aspects of human activity and supports education, health, and governance:
A) ICT (Information and Communication Technology)
B) Heavy industry
C) Traditional farming
D) Manual labor

Q119. Which document adopted at Rio+20 in 2012 emphasized the development of the SDGs?
A) The Paris Agreement
B) The Kyoto Protocol
C) The Future We Want
D) Agenda 21

Q120. The concept of "Sustainable Development" was first formally introduced in which report?
A) Human Development Report
B) World Development Report
C) The Brundtland Report (Our Common Future)
D) The Stern Review

Q121. Which of the following is a target of SDG 1 (No Poverty)?
A) Eradicate extreme poverty
B) End hunger
C) Ensure clean water
D) Promote tourism

Q122. ___ occurs when the body adapts to a prolonged absence of food:
A) Obesity
B) Malnutrition
C) Dehydration
D) Hyper-nutrition

Q123. The "ECE" in India's national education policy stands for:
A) Electronic and Communication Engineering
B) Environmental Care Education
C) Early Childhood Care and Education
D) Economic Community Engagement

Q124. Approximately what percentage of the human body is composed of water?
A) 30%
B) 50%
C) 65%
D) 90%

Q125. Which SDG focuses on "Affordable and Clean Energy"?
A) SDG 5
B) SDG 7
C) SDG 9
D) SDG 13

Batch 6: Questions 126–150
Q126. The SDGs (Sustainable Development Goals) are also known as:
A) Millennium Goals
B) Development Targets
C) Environmental Standards
D) Global Goals

Q127. The Global Hunger Index ranks countries based on indicators such as:
A) Under-nourishment
B) Child wasting and stunting
C) Child mortality
D) All of the above

Q128. ___ absorb about 30% of the carbon dioxide produced by humans:
A) Deserts
B) Forests
C) Oceans
D) Ice caps

Q129. Education is an important tool for the ___ of the SDGs:
A) Discussion
B) Postponement
C) Implementation
D) Termination

Q130. One of the essential characteristics of ESD is that it:
A) Focuses only on theory
B) Is a one-time workshop
C) Uses interdisciplinary approaches
D) Is limited to science students

Q131. Education for Sustainable Development (ESD) aims to:
A) Discourage critical thinking
B) Equip learners to address global challenges through informed action
C) Focus solely on national history
D) Promote rote memorization

Q132. The Declaration on the Right to Development (1986) identifies ___ as essential for sustainable development:
A) Military alliances
B) International cooperation
C) Trade barriers
D) Cultural isolation

Q133. The concept of sustainability is:
A) Static
B) Evolving
C) Irrelevant
D) Completed

Q134. Which pedagogical approach is emphasized in ESD?
A) Passive listening
B) Teacher-dominated lectures
C) Participatory and critical thinking methods
D) Standardized testing only

Q135. SDGs have one advantage over the MDGs (Millennium Development Goals) in that they are:
A) Only for poor countries
B) Universal
C) Shorter in duration
D) Less ambitious

Q136. GDI stands for:
A) Gross Domestic Income
B) Gender-related Development Index
C) Global Development Initiative
D) General Data Integration

Q137. Peace education should:
A) Be limited to elites
B) Focus on all sections of society
C) Encourage conflict
D) Ignore social justice

Q138. One of the principles of ESD involves harmonizing economic development with:
A) Corporate profits only
B) Both Social and Environmental development
C) Military expansion
D) Advertising goals

Q139. Global Citizenship refers to the belief that individuals are members of:
A) Only one nation
B) Only one religion
C) Multiple diverse networks and a global community
D) No community at all

Q140. Which domain of learning is NOT a core part of Global Citizenship Education (GCED)?
A) Cognitive
B) Social-emotional
C) Behavioral
D) Technical (Manual labor focus)

Q141. The domains of GCED emphasize:
A) Knowledge, Empathy, and Action
B) Competition and Wealth
C) Rote learning and Silence
D) Isolation and Borders

Q142. Global Citizenship Education (GCED) is directly linked to which SDG target?
A) Target 4.7
B) Target 1.2
C) Target 6.1
D) Target 10.5

Q143. UNESCO-MGIEP advocates for the integration of ___ into education systems to promote global citizenship:
A) Only advanced math
B) Social and Emotional Learning (SEL)
C) Military training
D) Marketing skills

Q144. The green economy has interconnected goals, but which of the following is NOT one of them?
A) Improved human well-being
B) Reduced environmental risks
C) Increasing social exclusion
D) Resource efficiency

Q145. TVET stands for:
A) Technical and Vocational Education and Training
B) Television and Electronic Teaching
C) Total Value of Economic Trade
D) Technology and Video Educational Tool

Q146. Global Citizenship helps students develop an awareness of:
A) Only local problems
B) Active collaboration and interdependence
C) National superiority
D) Passive observance

Q147. Cultural and natural heritage serve to:
A) Divide people
B) Encourage pollution
C) Strengthen community identity and sustainability
D) Promote rapid urbanization

Q148. Which of the following is emphasized as an under-recognized resource for sustainable development?
A) Fossil fuels
B) Nuclear energy
C) Cultural heritage
D) Heavy industry

Q149. IGP stands for:
A) International Government Policy
B) Internal Growth Plan
C) Institutional Greening Plan
D) Independent Goal Protocol

Q150. ___ highlights the classification of the shift in work requirements due to green economic activities:
A) GDP
B) Census
C) G-ESO (Green Economic Shift in Occupations)
D) ISO 9001

Q151. The international framework for greening TVET for a green society is a:
A) Three-tier approach
B) One-step plan
C) Military strategy
D) Top-down mandate

Q152. A holistic framework for TVET institutions is required to support:
A) A green economy only
B) A green society only
C) Both A and B
D) Neither A nor B

Q153. The National Green Growth Policy focuses on:
A) Green occupations
B) Climate change
C) Social-economic development
D) All of the above

Q154. Green practices in classification are an indicator of:
A) Higher profits
B) Strict policing
C) Green curriculum
D) Industrial expansion

Q155. Not-for-profit entrepreneurship is an example of:
A) Social entrepreneurship
B) Corporate capitalism
C) Monopoly
D) Government agency

Q156. Commitment to ending diseases like AIDS and Malaria is focused on in which SDG?
A) SDG 1
B) SDG 3
C) SDG 5
D) SDG 8

Q157. Genetically defined human motor capacity is referred to as:
A) Mental agility
B) Social status
C) Physical fitness
D) Genetic engineering

Q158. Nutritional requirements for an individual are determined by:
A) Body mass
B) Physical activity
C) Both A and B
D) Financial status

Q159. Which of the following is NOT an indigenous system of medicine?
A) Ayurveda
B) Siddha
C) Modern Surgery
D) Unani

Q160. Which of the following is NOT a "health system building block" as suggested by the WHO?
A) Service delivery
B) Health workforce
C) Politics
D) Health information systems

Q161. Technology in health care infrastructure can be used through:
A) Tele-consultation
B) Mobile hospitals
C) Traditional herbalism
D) Manual record keeping

Q162. ___ in health care is how well a health care system meets its objectives:
A) Cost
B) Value
C) Speed
D) Size

Q163. The National Digital Health Mission will help in better management using the open framework called:
A) HTML
B) PDF
C) URL
D) API (Application Programming Interface)

Q164. The "Poshan Abhiyaan" in India was launched in:
A) 2014
B) 2016
C) 2018
D) 2020

Q165. Which framework extends the scope of Quality Improvement (QI) to include ecological sustainability?
A) SusQI (Sustainable Quality Improvement)
B) GDP
C) ISO 9000
D) Total Quality Management

Q166. What is the worst level of food security for a country?
A) Mild hunger
B) Famine
C) Over-production
D) Export surplus

Q167. Which program in India has been a key source of extra nourishment for millions of school-going children?
A) Skill India
B) Digital India
C) Mid-day Meal (PM-POSHAN)
D) Swachh Bharat

Q168. Which of the following is NOT a pillar of food security?
A) Availability
B) Food Tax
C) Accessibility
D) Utilization

Q169. ___ systems provide water for countries with unreliable or low rainfall:
A) Irrigation
B) Drainage
C) Pavement
D) Sewage

Q170. In high-income countries, hunger is mainly caused due to:
A) Lack of food production
B) War
C) Poverty and inequality
D) Natural disasters

Q171. Which form of malnutrition has to do with the quality of food rather than the quantity?
A) Obesity
B) Calorie deficiency
C) Overeating
D) Hidden Hunger

Q172. Which of the following is NOT a sustainable agriculture practice?
A) Organic farming
B) Using chemical fertilizers excessively
C) Crop rotation
D) Vermicomposting

Q173. Which of the following is a positive impact of the MGNREGA program?
A) Increased rural wages
B) Reduced gender wage gaps
C) Better access to food
D) All of the above

Q174. According to research, maternal education is positively associated with:
A) Children's health
B) Children's education
C) Children's nutrition
D) All of the above

Q175. As the world population grows, food production needs to rise by approximately ___ by 2050 to meet needs:
A) 50%
B) 10%
C) 100%
D) 5%

Q176. SDG 7 (Affordable and Clean Energy) has how many major targets?
A) Three
B) Five
C) Seven
D) Ten

Q177. As of recent data, which Indian state has the highest renewable energy capacity (especially solar and wind)?
A) Uttar Pradesh
B) Kerala
C) Karnataka
D) Bihar

Q178. The ___ won the Peace Nobel Prize in 2007 for its efforts in creating awareness about climate change:
A) World Bank
B) IPCC (Intergovernmental Panel on Climate Change)
C) WTO
D) UNESCO

Q179. Renewable energy technologies provide services for:
A) Lighting
B) Heating
C) Mobility
D) All of the above

Q180. Loss of biodiversity and risk of nuclear accidents are examples of the ___ impact of fuel extraction and use:
A) Financial
B) Political
C) Environmental
D) Artistic

Q181. Which of the following is NOT a political or security driver of renewable energy?
A) Energy independence
B) Reducing resource conflict
C) National security
D) Improving public health (This is a social/health driver)

Q182. Hydrogen for clean energy is produced mainly through which process?
A) Combustion
B) Fermentation
C) Distillation
D) Thermo-chemical (e.g., steam methane reforming)

Q183. Which of the following is the key Electric Vehicle (EV) industry body in India?
A) NITI Aayog
B) ISRO
C) RBI
D) SMEV (Society of Manufacturers of Electric Vehicles)

Q184. The ___ Agreement is a legally binding international treaty on climate change:
A) Geneva
B) London
C) Tokyo
D) Paris

Q185. A target of COP26 is to limit the global temperature rise to ___ to avoid climate catastrophe:
A) 1.5°C
B) 5.0°C
C) 10°C
D) 0.5°C

Q186. Zero-carbon solutions are becoming competitive across economic sectors representing ___ of emissions presently:
A) 5%
B) 25%
C) 75%
D) 100%

Q187. Which university in India offers a dual degree in Electrical Engineering with a specialization in Power and Energy Systems?
A) Delhi University
B) Mumbai University
C) IIT Kharagpur
D) JNU

Q188. Intentionally setting fire to the straw that remains after grains like rice and wheat are harvested is called:
A) Controlled burn
B) Stubble burning
C) Forest fire
D) Mulching

Q189. The Okayama Commitments (Japan) focus on:
A) Environmental conservation
B) Literacy
C) Empowerment
D) All of the above

Q190. Education is related to SDG 1 (No Poverty) because:
A) It makes people famous
B) It is a hobby
C) It is critical to lifting people out of poverty
D) It encourages consumption

Q191. The Frame Model structures sustainability competencies into cognitive, affective/motivational, and:
A) Financial
B) Industrial
C) Historical
D) Behavioral (Action) goals

Q192. Effective goal commitment and action is the core of any ___:
A) Competition
B) Motivation
C) Argument
D) Conflict

Q193. Which of the following is FALSE?
A) Peace is constructive
B) Sustainability requires peace
C) Education promotes peace
D) Warfare is inherently constructive

Q194. Which principle advocates taking action to avoid the possibility of irreversible environmental or social harm?
A) Precautionary Principle
B) Profit Principle
C) Expansion Principle
D) Delay Principle

Q195. In "GAP on ESD," the 'A' stands for:
A) Action (Global Action Programme)
B) Alliance
C) Assessment
D) Authority

Q196. Which of the following is NOT a key competency for sustainable development?
A) Systems thinking
B) Isolative thinking
C) Normative competency
D) Strategic competency

Q197. Which pedagogy sees students as autonomous learners and emphasizes the active development of knowledge?
A) Teacher-centered
B) Learner-centered
C) Textbook-centered
D) Examination-centered

Q198. Experience for action-oriented learning may come from:
A) Projects
B) Internships
C) Facilitating workshops
D) All of the above

Q199. Utopian storytelling and science fiction thinking are examples of which method in ESD?
A) Rote memorization
B) Math drills
C) Historical dates
D) Vision-building exercises

Q200. Which of the following is NOT a key competency area for assessment of ESD?
A) Systems thinking
B) Anticipatory thinking
C) Strategic thinking
D) Past thinking (limited only to history)
"""

answers = {
    26: 3, 27: 3, 28: 3, 29: 3, 30: 0, 31: 2, 32: 2, 33: 1, 34: 1, 35: 3,
    36: 0, 37: 2, 38: 3, 39: 3, 40: 2, 41: 3, 42: 1, 43: 2, 44: 1, 45: 2,
    46: 3, 47: 1, 48: 2, 49: 1, 50: 3, 51: 1, 52: 1, 53: 0, 54: 3, 55: 1,
    56: 3, 57: 0, 58: 1, 59: 0, 60: 1, 61: 0, 62: 2, 63: 3, 64: 1, 65: 1,
    66: 0, 67: 1, 68: 2, 69: 0, 70: 2, 71: 0, 72: 0, 73: 3, 74: 2, 75: 1,
    76: 3, 77: 1, 78: 2, 79: 2, 80: 1, 81: 1, 82: 3, 83: 0, 84: 1, 85: 0,
    86: 0, 87: 0, 88: 3, 89: 1, 90: 1, 91: 3, 92: 0, 93: 1, 94: 0, 95: 3,
    96: 0, 97: 3, 98: 3, 99: 1, 100: 3, 101: 3, 102: 2, 103: 1, 104: 3,
    105: 1, 106: 3, 107: 0, 108: 3, 109: 0, 110: 0, 111: 3, 112: 0, 113: 3,
    114: 3, 115: 2, 116: 0, 117: 2, 118: 0, 119: 2, 120: 2, 121: 0, 122: 1,
    123: 2, 124: 2, 125: 1, 126: 3, 127: 3, 128: 2, 129: 2, 130: 2, 131: 1,
    132: 1, 133: 1, 134: 2, 135: 1, 136: 1, 137: 1, 138: 1, 139: 2, 140: 3,
    141: 0, 142: 0, 143: 1, 144: 2, 145: 0, 146: 1, 147: 2, 148: 2, 149: 2,
    150: 2, 151: 0, 152: 2, 153: 3, 154: 2, 155: 0, 156: 1, 157: 2, 158: 2,
    159: 2, 160: 2, 161: 0, 162: 1, 163: 3, 164: 2, 165: 0, 166: 1, 167: 2,
    168: 1, 169: 0, 170: 2, 171: 3, 172: 1, 173: 3, 174: 3, 175: 0, 176: 1,
    177: 2, 178: 1, 179: 3, 180: 2, 181: 3, 182: 3, 183: 3, 184: 3, 185: 0,
    186: 1, 187: 2, 188: 1, 189: 3, 190: 2, 191: 3, 192: 1, 193: 3, 194: 0,
    195: 0, 196: 1, 197: 1, 198: 3, 199: 3, 200: 3
}

questions = []
lines = raw_text.split('\n')

current_q = None

for line in lines:
    line = line.strip()
    if not line: continue
    if line.startswith('Batch'): continue
    
    match_q = re.match(r'^Q(\d+)\.(.+)$', line)
    if match_q:
        q_num = int(match_q.group(1))
        q_text = match_q.group(2).strip()
        current_q = {
            'id': q_num,
            'q': q_text,
            'opts': [],
            'a': answers.get(q_num, 0)
        }
        questions.append(current_q)
    else:
        match_opt = re.match(r'^[A-D]\)\s*(.+)$', line)
        if match_opt and current_q:
            current_q['opts'].append(match_opt.group(1).strip())
        elif current_q and len(current_q['opts']) == 0:
            current_q['q'] += " " + line

for q in questions:
    del q['id']

output = "const extraQuestions = " + json.dumps(questions, indent=2) + ";"
with open('e:/vmedia-main/scripts/extraQuestions.js', 'w', encoding='utf-8') as f:
    f.write(output)

print("Done. Generated", len(questions), "questions.")
