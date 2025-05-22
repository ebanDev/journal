export default defineAppConfig({
  ui: {
    colors: {
      primary: 'red',
      secondary: 'amber',
      neutral: 'stone'
    },
    navigationMenu: {
      compoundVariants: [
        {
          variant: 'pill',
          active: true,
          highlight: false,
          class: {
            link: 'before:bg-secondary-300',
          }
        },
        {
          variant: 'pill',
          active: true,
          highlight: true,
          class: {
            link: 'before:bg-secondary-400',
          }
        }
      ]
    },
    button: {
      slots: {
        leadingIcon: '!size-5'
      },
      compoundVariants: [
        {
          color: 'secondary',
          variant: 'solid',
          class: 'bg-secondary-300 text-black hover:bg-secondary-400'
        },
      ],
    },
    input: {
      variants: {
        variant: {
          outline: 'ring-0 bg-secondary-300'
        }
      }
    },
    tabs: {
      variants: {
        variant: {
          pill: {
            list: 'bg-secondary-300',
          }
        },
      },
    }
  }
})
