# Landing Page Build System Handoff

- Parent task: Relocate the CMS landing build system and stabilize Field Service Operations updates
- From zone: Repository documentation
- To zone: Landing page source, Landing page build tooling, Landing page generated output
- Blocking dependency: Legacy `docs/cms-components/lab-ui/**` mixed authored source, executable tooling, and generated packages
- Required inputs: normalized block catalog, compositions, repo-owned Field Service copy/mapping, compiler and operator scripts
- Expected outputs: canonical `app-templates/landing-page/**` implementation, forwarding-only legacy CLI facade, deterministic Field Service manual package
- Acceptance criteria: old implementation removed from docs; paths/ownership aligned; export/check pass; dry-run resolves existing codes and IDs without writes
- Target time: current migration
- Owner: landing-experience
- Backup owner: repository-maintenance

## Evidence

- Linked commits: `8c33e96` (relocation/tooling) and `6ad18ac` (Field Service flow)
- Validation commands and results: recorded in the implementation closeout
- Follow-up risks: real Field Service root UUID and manual PageContext/include verification remain operator-owned
