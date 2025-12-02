# todos

## Bugs
- [ ] Fix document upload on add new application form

## data model
- [ ] remove interviewers table, ts type. models, routes, resolvers, components, stores, etc.
- [ ] determine document linking model.
- [ ] document.url vs document.file_url?
- [ ] research document.content?
- [ ] remove contacts.company_name?
- [ ] add company.remote_policy_hybrid_dpw
- [ ] add company.mission and company.values
- [ ] remove application.sort_order?
- [ ] remove application.response_deadline, application.offer_date, application.first_interview_date, application.target_date?
- [ ] replace application.company_name with company_id foreign key
- [ ] add company logo/avatar

## UI
-  [ ] ensure company, application, interview text fields are markdown formatted
- [ ] add application.source autocomplete
- [ ] add application.location autocomplete (city, state)
- [ ] make application.company_id form field a searchable select w/ add using company.name.
- [ ] add application interviews timeline view
- [ ] add application_status "archived", add archive button to application view, and add include archived to applications filters.
- [ ] add/edit interviews from application view
- [ ] add/edit contacts from company view.
- [ ] application filtering by this week, last week, last 30/60/90 days, last 6mo, last yr, all time
- [ ] add company logo/avatar to views.
- [ ] add detailed funding data from crunchbase
- [ ] add recent company news/headlines

## Monitoring
- [x] add sentry monitoring for backend errors
- [x] add sentry monitoring for frontend errors
- [x] add logging for backend requests
- [x] add logging for frontend requests

## Analytics
- [ ] add # applications this week
- [ ] add # interviews this week

## Extension/integrations
- [ ] build chrome extension
    - [ ] auto tracking submitted job applications
    - [ ] bookmarking job applications
    - [ ] add company site to companies list
    - [ ] find company contacts
    - [ ] ai generated/templated follow-up emails
- [ ] integrate with crunchbase for company research
- [ ] integrate with glassdoor for company reviews

## AI features
- [ ] add ai company research
- [ ] add ai interview prep
- [ ] add ai follow-up emails
- [ ] add ai interview thank you emails
- [ ] add ai job search/discovery